import { expect, test } from "@playwright/test";

const category = { id: "peripherals", slug: "peripherals", name: "Периферия" };
const product = {
  id: "keyboard",
  title: "Split keyboard",
  description: "Удобная клавиатура для работы",
  priceMinor: 14900,
  currency: "USD",
  category,
  rating: null,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/categories")
      return route.fulfill({
        json: [category, { id: "new", slug: "new", name: "Новая категория" }],
      });
    if (url.pathname === "/api/products/keyboard") return route.fulfill({ json: product });
    if (url.pathname === "/api/products")
      return route.fulfill({ json: url.searchParams.get("category") === "new" ? [] : [product] });
    if (url.pathname === "/api/cart/items")
      return route.fulfill({
        json: { items: [], totalMinor: 14900, currency: "USD", revision: 1 },
      });
    return route.fulfill({ status: 404, json: { message: "Не найдено" } });
  });
});

test("category description, direct link, product return and cart", async ({ page }) => {
  await page.goto("/catalog/category/peripherals");
  await expect(page.getByRole("heading", { name: "Периферия", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "О категории" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "На что обратить внимание" })).toBeVisible();
  await expect(page.getByText("Товаров: 1")).toBeVisible();
  await page.getByRole("link", { name: "Split keyboard" }).click();
  await expect(page).toHaveURL(/\/products\/keyboard\?category=peripherals&from=category$/);
  await page.reload();
  await page.getByRole("link", { name: "← К списку товаров" }).click();
  await expect(page).toHaveURL(/\/category\/peripherals$/);
  const added = page.waitForRequest(
    (request) => request.url().endsWith("/api/cart/items") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Добавить Split keyboard", exact: true }).click();
  expect((await added).postDataJSON()).toEqual({ productId: "keyboard", quantity: 1 });
  await expect(page.getByRole("status")).toHaveText("Добавлено: Split keyboard");
  // The breadcrumb works even when the product was opened without category context.
  await page.goto("/catalog/products/keyboard");
  await page.getByRole("link", { name: "Периферия", exact: true }).click();
  await expect(page).toHaveURL(/\/category\/peripherals$/);
});

test("unknown category and a new empty category with fallback content", async ({ page }) => {
  await page.goto("/catalog/category/missing");
  await expect(page.getByRole("heading", { name: "Категория не найдена" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toHaveCount(0);
  await page.goto("/catalog/category/new");
  await expect(page.getByRole("heading", { name: "Новая категория", exact: true })).toBeVisible();
  await expect(page.getByText("В этой категории пока нет товаров.")).toBeVisible();
  await expect(page.getByText("Найдите подходящее решение для ваших задач.")).toBeVisible();
});

test("category and product errors retry independently", async ({ page }) => {
  let categoryFailed = true;
  let productsFailed = true;
  await page.route("**/api/categories", (route) =>
    route.fulfill(
      categoryFailed
        ? { status: 503, json: { message: "Категории недоступны" } }
        : { json: [category] },
    ),
  );
  await page.route("**/api/products?**", (route) =>
    route.fulfill(
      productsFailed
        ? { status: 503, json: { message: "Товары недоступны" } }
        : { json: [product] },
    ),
  );
  await page.goto("/catalog/category/peripherals");
  await expect(page.getByRole("alert")).toContainText("Категории недоступны");
  categoryFailed = false;
  await page.getByRole("button", { name: "Повторить загрузку категории" }).click();
  await expect(page.getByRole("heading", { name: "О категории" })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText("Товары недоступны");
  productsFailed = false;
  await page.getByRole("button", { name: "Повторить загрузку товаров" }).click();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
});

test("loading skeletons and mobile layout", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/categories", async (route) => {
    await ready;
    await route.fulfill({ json: [category] });
  });
  await page.goto("/catalog/category/peripherals");
  await expect(page.getByRole("status", { name: "Загружаем категорию" })).toBeVisible();
  release();
  await expect(page.getByRole("heading", { name: "Периферия", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Периферия", exact: true })).toHaveCSS(
    "font-size",
    "30px",
  );
  await expect(page.getByRole("link", { name: "Смотреть товары" })).toHaveCSS(
    "color",
    "rgb(250, 250, 250)",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: "test-results/category-mobile.png", fullPage: true });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: "test-results/category-desktop.png", fullPage: true });
});

test("legacy query filter remains usable", async ({ page }) => {
  await page.goto("/catalog?category=peripherals");
  await page.getByRole("link", { name: "Split keyboard" }).click();
  await page.getByRole("link", { name: "← К списку товаров" }).click();
  await expect(page).toHaveURL(/\/catalog\?category=peripherals$/);
  await page.getByRole("button", { name: "Все товары", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
});
