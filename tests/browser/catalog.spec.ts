import { expect, test } from "@playwright/test";

const categories = [
  { id: "peripherals", slug: "peripherals", name: "Периферия" },
  { id: "monitors", slug: "monitors", name: "Мониторы" },
  { id: "other", slug: "other", name: "Прочее" },
];
const products = [
  {
    id: "keyboard",
    title: "Split keyboard",
    description: "Полное описание клавиатуры",
    category: categories[0],
    priceMinor: 14900,
    currency: "USD",
    rating: null,
  },
  {
    id: "monitor",
    title: "Portable monitor",
    description: "Полное описание монитора",
    category: categories[1],
    priceMinor: 22900,
    currency: "USD",
    rating: 4.5,
  },
];

test.beforeEach(async ({ page }) => {
  await page.route(
    (url) => url.pathname.startsWith("/api/"),
    async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === "/api/categories") return route.fulfill({ json: categories });
      if (url.pathname === "/api/products") {
        const slug = url.searchParams.get("category");
        if (slug !== null && !categories.some((item) => item.slug === slug))
          return route.fulfill({ status: 404, json: { message: "Категория не найдена" } });
        return route.fulfill({
          json: slug === null ? products : products.filter((item) => item.category.slug === slug),
        });
      }
      if (url.pathname.startsWith("/api/products/")) {
        const product = products.find((item) => item.id === url.pathname.split("/").at(-1));
        return route.fulfill(
          product ? { json: product } : { status: 404, json: { message: "Товар не найден" } },
        );
      }
      if (url.pathname === "/api/cart/items")
        return route.fulfill({
          json: { items: [], totalMinor: 14900, currency: "USD", revision: 1 },
        });
      return route.fulfill({ status: 404, json: { message: "Unknown API" } });
    },
  );
});

test("category filter survives reload and browser back/forward", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
  await page.getByRole("button", { name: "Мониторы", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\?category=monitors$/);
  await expect(page.getByRole("link", { name: "Portable monitor" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("button", { name: "Мониторы", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Все товары", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await page.goBack();
  await expect(page).toHaveURL(/category=monitors$/);
  await page.goForward();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
});

test("details load by ID, preserve the filter and add to the cart", async ({ page }) => {
  await page.goto("/catalog?category=peripherals");
  await page.getByRole("link", { name: "Split keyboard" }).click();
  await expect(page).toHaveURL(/\/catalog\/products\/keyboard\?category=peripherals$/);
  await expect(page.getByText("Полное описание клавиатуры")).toBeVisible();
  await expect(page.getByText("Пока нет оценок")).toBeVisible();
  await page.reload();
  const added = page.waitForRequest(
    (request) => request.url().endsWith("/api/cart/items") && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Добавить Split keyboard", exact: true }).click();
  expect((await added).postDataJSON()).toEqual({ productId: "keyboard", quantity: 1 });
  await expect(page.getByText("Добавлено: Split keyboard", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "← К списку товаров" }).click();
  await expect(page).toHaveURL(/\/catalog\?category=peripherals$/);
  await expect(page.getByRole("link", { name: "Portable monitor" })).toHaveCount(0);
});

test("direct details link and unknown product, category and route", async ({ page }) => {
  await page.goto("/catalog/products/monitor");
  await expect(page.getByRole("heading", { name: "Portable monitor" })).toBeVisible();
  await expect(page.getByText("4.5 из 5")).toBeVisible();
  await page.goto("/catalog/products/missing");
  await expect(page.getByRole("heading", { name: "Товар не найден" })).toBeVisible();
  await page.goto("/catalog?category=missing");
  await expect(page.getByRole("alert")).toContainText("Категория не найдена");
  await page.getByRole("button", { name: "Прочее", exact: true }).click();
  await expect(page.getByText("В этой категории пока нет товаров.")).toBeVisible();
  await page.goto("/catalog/unknown/page");
  await expect(page.getByRole("heading", { name: "Страница не найдена" })).toBeVisible();
});

test("failed product request offers a retry", async ({ page }) => {
  let failed = true;
  await page.route("**/api/products/keyboard", (route) => {
    if (failed) return route.fulfill({ status: 503, json: { message: "Временная ошибка" } });
    return route.fulfill({ json: products[0] });
  });
  await page.goto("/catalog/products/keyboard");
  await expect(page.getByRole("alert")).toContainText("Временная ошибка");
  failed = false;
  await page.getByRole("button", { name: "Повторить загрузку товара" }).click();
  await expect(page.getByText("Полное описание клавиатуры")).toBeVisible();
});
