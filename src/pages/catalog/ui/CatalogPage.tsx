import { useState } from "react";
import { Badge, Button } from "@microfronts/ui";
import type { CatalogProps } from "@microfronts/contracts";
import { useProducts, type Product } from "../../../entities/product";
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
  const productsQuery = useProducts(context);
  const mutation = useAddToCart(context, onCartChanged);
  const pendingProductId = mutation.isPending ? (mutation.variables?.id ?? null) : null;
  const error = productsQuery.error?.message ?? mutation.error?.message;

  function add(product: Product) {
    setNotice("");
    mutation.mutate(product, { onSuccess: () => setNotice("Добавлено: " + product.title) });
  }

  return (
    <section className="catalog catalog:grid catalog:gap-[18px]" aria-label="Каталог">
      <div className="catalog-title">
        <Badge>catalog</Badge>
        <p>Товары из API.</p>
        <TestComponent />
      </div>
      {productsQuery.isPending && (
        <p role="status">Загружаем каталог… Первый запуск API может занять минуту.</p>
      )}
      {error && (
        <div role="alert">
          {error} <Button onClick={() => void productsQuery.refetch()}>Обновить каталог</Button>
        </div>
      )}
      <p role="status">{notice}</p>
      {onNavigate && notice && (
        <Button onClick={() => onNavigate("cart")}>Перейти в корзину</Button>
      )}
      <div className="product-list">
        {(productsQuery.data ?? []).map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            pendingProductId={pendingProductId}
            onAdd={add}
          />
        ))}
      </div>
    </section>
  );
}
