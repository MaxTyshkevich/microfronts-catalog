import { useState } from "react";
import { useSearchParams } from "react-router";
import { Badge, Button } from "@microfronts/ui";
import type { CatalogProps } from "@microfronts/contracts";
import { useProducts, type Product } from "../../../entities/product";
import { useCategories } from "../../../entities/category";
import { HttpError } from "../../../shared/api";
import { useAddToCart } from "../../../features/add-to-cart";
import { ProductCard } from "./ProductCard";
import "./catalog.css";
import { TestComponent } from "./TestComponent";

export function CatalogPage({
  apiBaseUrl,
  cartKey,
  sessionScope,
  onUnauthorized,
  onCartChanged,
  onNavigate,
}: CatalogProps) {
  const [notice, setNotice] = useState("");
  const context = { apiBaseUrl, cartKey, sessionScope, onUnauthorized };
  const [search, setSearch] = useSearchParams();
  const category = search.get("category") ?? undefined;
  const categoriesQuery = useCategories(context);
  const productsQuery = useProducts(context, category);
  const mutation = useAddToCart(context, onCartChanged);
  const pendingProductId = mutation.isPending ? (mutation.variables?.id ?? null) : null;
  const error = productsQuery.error?.message;
  const categoryMissing =
    productsQuery.error instanceof HttpError && productsQuery.error.status === 404;

  function selectCategory(slug?: string) {
    setNotice("");
    setSearch((previous) => {
      const next = new URLSearchParams(previous);
      if (slug === undefined) next.delete("category");
      else next.set("category", slug);
      return next;
    });
  }

  function add(product: Product) {
    setNotice("");
    mutation.mutate(product, { onSuccess: () => setNotice("Добавлено: " + product.title) });
  }

  return (
    <section className="catalog catalog:grid catalog:gap-[18px]" aria-label="Каталог">
      <div className="catalog-title">
        <Badge>catalog</Badge>
        <h2>Товары</h2>
        <TestComponent />
      </div>
      <div className="catalog-layout">
        <aside className="category-sidebar" aria-label="Категории товаров">
          <h3>Категории</h3>
          <button
            type="button"
            aria-pressed={category === undefined}
            onClick={() => selectCategory()}
          >
            Все товары
          </button>
          {categoriesQuery.isPending && <p role="status">Загружаем категории…</p>}
          {categoriesQuery.isError && (
            <div role="alert">
              Не удалось загрузить категории.{" "}
              <Button onClick={() => void categoriesQuery.refetch()}>
                Повторить загрузку категорий
              </Button>
            </div>
          )}
          {(categoriesQuery.data ?? []).map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={category === item.slug}
              onClick={() => selectCategory(item.slug)}
            >
              {item.name}
            </button>
          ))}
        </aside>
        <div className="catalog-results">
          {productsQuery.isPending && (
            <p role="status">Загружаем каталог… Первый запуск API может занять минуту.</p>
          )}
          {error && (
            <div role="alert">
              {categoryMissing ? "Категория не найдена" : error}{" "}
              <Button onClick={() => void productsQuery.refetch()}>Обновить каталог</Button>
            </div>
          )}
          <p role="status">{notice}</p>
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
          {onNavigate && notice && (
            <Button onClick={() => onNavigate("cart")}>Перейти в корзину</Button>
          )}
          <div className="product-list">
            {productsQuery.isSuccess && productsQuery.data.length === 0 && (
              <p>В этой категории пока нет товаров.</p>
            )}
            {(productsQuery.data ?? []).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                pendingProductId={pendingProductId}
                onAdd={add}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
