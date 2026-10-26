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

test("category navigation survives reload and browser back/forward", async ({ page }) => {
  await page.goto("/catalog");
  await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
  await page.getByRole("link", { name: "Мониторы", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog\/category\/monitors$/);
  await expect(page.getByRole("link", { name: "Portable monitor" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Split keyboard" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Мониторы", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Весь каталог", exact: true }).click();
  await expect(page).toHaveURL(/\/catalog$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/category\/monitors$/);
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
  await page.getByRole("link", { name: "Прочее", exact: true }).click();
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

test("catalog skeletons, retry and cart feedback", async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  let failed = true;
  await page.route("**/api/products", async (route) => {
    await ready;
    return route.fulfill(
      failed ? { status: 503, json: { message: "Каталог недоступен" } } : { json: products },
    );
  });
  await page.goto("/catalog");
  await expect(page.getByRole("status", { name: "Загружаем каталог", exact: true })).toBeVisible();
  release();
  await expect(page.getByRole("alert")).toContainText("Каталог недоступен");
  failed = false;
  await page.getByRole("button", { name: "Обновить каталог" }).click();
  await expect(page.getByText("Товаров: 2")).toBeVisible();
  await page.getByRole("button", { name: "Добавить Split keyboard", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Добавлено: Split keyboard");
});

test("catalog and product styles remain usable on mobile and desktop", async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/catalog");
    await expect(page.getByRole("heading", { name: "Товары", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Split keyboard" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Все товары", exact: true })).toHaveCSS(
      "color",
      "rgb(250, 250, 250)",
    );
    await expect(
      page.getByRole("button", { name: "Добавить Split keyboard", exact: true }),
    ).toHaveCSS("background-color", "rgb(24, 24, 27)");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: "test-results/catalog-" + width + ".png", fullPage: true });
    await page.getByRole("link", { name: "Split keyboard" }).click();
    await expect(page.getByRole("heading", { name: "О товаре", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Добавить Split keyboard", exact: true }),
    ).toHaveCSS("color", "rgb(250, 250, 250)");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: "test-results/product-" + width + ".png", fullPage: true });
  }
});

test("product loading has an accessible skeleton", async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/products/keyboard", async (route) => {
    await ready;
    await route.fulfill({ json: products[0] });
  });
  await page.goto("/catalog/products/keyboard");
  await expect(page.getByRole("status", { name: "Загружаем товар", exact: true })).toBeVisible();
  release();
  await expect(page.getByRole("heading", { name: "Split keyboard", exact: true })).toBeVisible();
});
