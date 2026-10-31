import { expect, test, type Page } from "@playwright/test";

const categories = [{ id: "other", slug: "other", name: "Прочее" }];
const user = { id: "admin-id", name: "Admin", email: "admin@example.com", role: "ADMIN" };

async function mockApi(
  page: Page,
  options: { role?: string | null; status?: number; delay?: boolean } = {},
) {
  let role = options.role === undefined ? "ADMIN" : options.role;
  const products: object[] = [];
  const posts: object[] = [];
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/auth/me")
      return route.fulfill({ json: { user: role ? { ...user, role } : null } });
    if (url.pathname === "/api/categories") return route.fulfill({ json: categories });
    if (url.pathname === "/api/products" && route.request().method() === "POST") {
      expect(route.request().headers()["x-session-user"]).toBe(user.id);
      expect(route.request().headers()["x-requested-with"]).toBe("microfronts");
      const data = route.request().postDataJSON();
      posts.push(data);
      if (options.delay) await new Promise((resolve) => setTimeout(resolve, 500));
      if (options.status) {
        if (options.status === 403) role = "USER";
        if (options.status === 401) role = null;
        return route.fulfill({
          status: options.status,
          json: {
            message:
              options.status === 409 ? "Товар с таким ID уже существует" : "Недостаточно прав",
          },
        });
      }
      const product = {
        ...data,
        currency: "USD",
        rating: null,
        category: categories[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      products.push(product);
      return route.fulfill({ status: 201, json: product });
    }
    if (url.pathname === "/api/products") return route.fulfill({ json: products });
    return route.fulfill({ status: 404, json: {} });
  });
  return posts;
}

async function fillProduct(page: Page) {
  await page.getByLabel("ID товара", { exact: true }).fill("wireless-keyboard");
  await page.getByLabel("Название", { exact: true }).fill("Новая клавиатура");
  await page.getByLabel("Описание", { exact: true }).fill("Описание нового товара");
  await page.getByLabel("Цена, USD", { exact: true }).fill("123.45");
  await page.getByLabel("Категория", { exact: true }).selectOption("other");
}

for (const role of [null, "USER"]) {
  test(`hides creation for ${role ?? "guest"}`, async ({ page }) => {
    await mockApi(page, { role });
    const session = page.waitForResponse("**/api/auth/me");
    await page.goto("/catalog");
    await session;
    await expect(page.getByRole("heading", { name: "Товары", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Создать товар", exact: true })).toHaveCount(0);
  });
}

test("admin validates, creates once and refreshes products", async ({ page }) => {
  const posts = await mockApi(page, { delay: true });
  await page.goto("/catalog");
  await page.getByRole("button", { name: "Создать товар", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Создать товар", exact: true });
  await expect(dialog).toBeVisible();
  await page.getByRole("button", { name: "Создать", exact: true }).click();
  await expect(page.getByText("Укажите название", { exact: true })).toBeVisible();
  expect(posts).toHaveLength(0);
  await fillProduct(page);
  await page.getByRole("button", { name: "Создать", exact: true }).click();
  await expect(page.getByRole("button", { name: "Создаём…" })).toBeDisabled();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Новая клавиатура", exact: true })).toBeVisible();
  expect(posts).toEqual([
    {
      id: "wireless-keyboard",
      title: "Новая клавиатура",
      description: "Описание нового товара",
      priceMinor: 12345,
      categoryId: "other",
    },
  ]);
});

test("dialog supports Escape, focus restoration and mobile layout", async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/catalog");
  const trigger = page.getByRole("button", { name: "Создать товар", exact: true });
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(page.getByLabel("ID товара", { exact: true })).toBeFocused();
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  await expect(dialog).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.screenshot({ path: "test-results/create-product-mobile.png", fullPage: true });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

for (const status of [401, 403, 409]) {
  test(`handles ${status} without closing or losing the form`, async ({ page }) => {
    await mockApi(page, { status });
    await page.goto("/catalog");
    await page.getByRole("button", { name: "Создать товар", exact: true }).click();
    await fillProduct(page);
    await page.getByRole("button", { name: "Создать", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page
        .getByRole("alert")
        .filter({
          hasText: status === 409 ? "Товар с таким ID уже существует" : "Недостаточно прав",
        }),
    ).toBeVisible();
    await expect(page.getByLabel("Название", { exact: true })).toHaveValue("Новая клавиатура");
    if (status !== 409)
      await expect(page.getByRole("button", { name: "Создать", exact: true })).toBeDisabled();
  });
}
