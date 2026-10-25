import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { Button } from "@microfronts/ui";
import type { CatalogProps } from "@microfronts/contracts";
import { useProduct } from "../../../entities/product";
import { useAddToCart, AddToCartButton } from "../../../features/add-to-cart";
import { HttpError } from "../../../shared/api";
import { formatMoney } from "../../../shared/lib";
import "./product.css";

export function ProductPage({
  apiBaseUrl,
  cartKey,
  sessionScope,
  onUnauthorized,
  onCartChanged,
  onNavigate,
}: CatalogProps) {
  const { productId = "" } = useParams();
  const { search } = useLocation();
  const origin = new URLSearchParams(search);
  const categoryOrigin = origin.get("from") === "category" ? origin.get("category") : null;
  const backTo = categoryOrigin
    ? "/catalog/category/" + encodeURIComponent(categoryOrigin)
    : "/catalog" + search;
  const context = { apiBaseUrl, cartKey, sessionScope, onUnauthorized };
  const query = useProduct(context, productId);
  const mutation = useAddToCart(context, onCartChanged);
  const [addedId, setAddedId] = useState<string | null>(null);
  const product = query.data;
  const missing = query.error instanceof HttpError && query.error.status === 404;

  return (
    <section className="catalog-product" aria-label="Описание товара">
      <Link to={backTo}>← К списку товаров</Link>
      {query.isPending && <p role="status">Загружаем товар…</p>}
      {query.isError && (
        <div role="alert">
          <h2>{missing ? "Товар не найден" : "Не удалось загрузить товар"}</h2>
          {!missing && (
            <>
              <p>{query.error.message}</p>
              <Button onClick={() => void query.refetch()}>Повторить загрузку товара</Button>
            </>
          )}
        </div>
      )}
      {product && (
        <>
          <nav aria-label="Путь к товару">
            <Link to="/catalog">Каталог</Link> /{" "}
            <Link to={"/catalog/category/" + encodeURIComponent(product.category.slug)}>
              {product.category.name}
            </Link>
          </nav>
          <h2>{product.title}</h2>
          {product.badge && <p>{product.badge}</p>}
          <p className="product-description">{product.description}</p>
          <dl>
            <dt>Категория</dt>
            <dd>{product.category.name}</dd>
            <dt>Рейтинг</dt>
            <dd>{product.rating === null ? "Пока нет оценок" : `${product.rating} из 5`}</dd>
          </dl>
          <strong className="product-price">
            {formatMoney(product.priceMinor, product.currency)}
          </strong>
          <AddToCartButton
            product={product}
            pendingProductId={mutation.isPending ? (mutation.variables?.id ?? null) : null}
            onAdd={(item) => {
              setAddedId(null);
              mutation.mutate(item, { onSuccess: () => setAddedId(item.id) });
            }}
          />
          {mutation.isError && <p role="alert">{mutation.error.message}</p>}
          {addedId === product.id && <p role="status">Добавлено: {product.title}</p>}
          {addedId === product.id && onNavigate && (
            <Button onClick={() => onNavigate("cart")}>Перейти в корзину</Button>
          )}
        </>
      )}
    </section>
  );
}
