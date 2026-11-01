import { useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { ArrowRight, Check, ChevronRight, Star } from "lucide-react";
import type { CatalogProps } from "@microfronts/contracts";
import { useProduct } from "@/entities/product";
import { useAddToCart, AddToCartButton } from "@/features/add-to-cart";
import { HttpError } from "@/shared/api";
import { formatMoney } from "@/shared/lib";
import { Button, Card, CardContent, CardHeader, Skeleton } from "@/shared/ui";

export function ProductPage(props: CatalogProps) {
  const { productId = "" } = useParams();
  return <ProductDetails key={productId} {...props} productId={productId} />;
}

function ProductDetails({
  productId,
  apiBaseUrl,
  cartKey,
  sessionScope,
  onUnauthorized,
  onCartChanged,
  onNavigate,
}: CatalogProps & { productId: string }) {
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
    <section className="catalog:grid catalog:gap-6 catalog:py-2" aria-label="Описание товара">
      <Button asChild variant="ghost" className="catalog:w-fit">
        <Link to={backTo}>← К списку товаров</Link>
      </Button>
      {query.isPending && (
        <div role="status" aria-label="Загружаем товар" className="catalog:grid catalog:gap-4">
          <span className="catalog:sr-only">Загружаем товар…</span>
          <Skeleton className="catalog:h-6 catalog:w-1/3" />
          <Skeleton className="catalog:h-12 catalog:w-3/4" />
          <Skeleton className="catalog:h-72 catalog:w-full catalog:rounded-xl" />
        </div>
      )}
      {query.isError && (
        <Card role="alert">
          <CardHeader>
            <h1 className="catalog:m-0 catalog:text-2xl catalog:font-semibold">
              {missing ? "Товар не найден" : "Не удалось загрузить товар"}
            </h1>
          </CardHeader>
          <CardContent className="catalog:grid catalog:justify-items-start catalog:gap-4">
            <p className="catalog:m-0 catalog:text-muted-foreground">
              {missing
                ? "Проверьте адрес или выберите другой товар в каталоге."
                : query.error.message}
            </p>
            {!missing && (
              <Button variant="outline" onClick={() => void query.refetch()}>
                Повторить загрузку товара
              </Button>
            )}
          </CardContent>
        </Card>
      )}
      {product && (
        <>
          <nav aria-label="Путь к товару">
            <ol className="catalog:m-0 catalog:flex catalog:list-none catalog:flex-wrap catalog:items-center catalog:gap-2 catalog:p-0 catalog:text-sm catalog:text-muted-foreground">
              <li>
                <Link className="catalog:underline-offset-4 catalog:hover:underline" to="/catalog">
                  Каталог
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li>
                <Link
                  className="catalog:underline-offset-4 catalog:hover:underline"
                  to={"/catalog/category/" + encodeURIComponent(product.category.slug)}
                >
                  {product.category.name}
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight size={14} />
              </li>
              <li aria-current="page" className="catalog:min-w-0 catalog:break-words">
                {product.title}
              </li>
            </ol>
          </nav>
          <header className="catalog:grid catalog:gap-3">
            {product.badge && (
              <span className="catalog:w-fit catalog:rounded-full catalog:bg-muted catalog:px-3 catalog:py-1 catalog:text-xs catalog:font-medium">
                {product.badge}
              </span>
            )}
            <h1 className="catalog:m-0 catalog:break-words catalog:text-3xl catalog:font-semibold catalog:tracking-tight catalog:sm:text-4xl">
              {product.title}
            </h1>
          </header>
          <div className="catalog:grid catalog:items-start catalog:gap-6 catalog:lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card className="catalog:min-w-0">
              <CardHeader>
                <h2 className="catalog:m-0 catalog:text-lg catalog:font-semibold">О товаре</h2>
              </CardHeader>
              <CardContent className="catalog:grid catalog:gap-6">
                <p className="catalog:m-0 catalog:whitespace-pre-wrap catalog:wrap-anywhere catalog:leading-7 catalog:text-muted-foreground">
                  {product.description}
                </p>
                <dl className="catalog:m-0 catalog:grid catalog:gap-4 catalog:border-t catalog:border-border catalog:pt-6 catalog:text-sm">
                  <div className="catalog:flex catalog:flex-wrap catalog:justify-between catalog:gap-2">
                    <dt className="catalog:text-muted-foreground">Категория</dt>
                    <dd className="catalog:m-0 catalog:font-medium">{product.category.name}</dd>
                  </div>
                  <div className="catalog:flex catalog:flex-wrap catalog:justify-between catalog:gap-2">
                    <dt className="catalog:text-muted-foreground">Рейтинг</dt>
                    <dd className="catalog:m-0 catalog:flex catalog:items-center catalog:gap-2 catalog:font-medium">
                      <Star size={16} aria-hidden="true" />
                      {product.rating === null ? "Пока нет оценок" : `${product.rating} из 5`}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
            <Card className="catalog:min-w-0">
              <CardHeader>
                <h2 className="catalog:m-0 catalog:text-sm catalog:font-medium catalog:text-muted-foreground">
                  Цена
                </h2>
                <strong className="catalog:wrap-anywhere catalog:text-3xl catalog:tracking-tight">
                  {formatMoney(product.priceMinor, product.currency)}
                </strong>
              </CardHeader>
              <CardContent className="catalog:grid catalog:gap-4">
                <AddToCartButton
                  product={product}
                  pendingProductId={mutation.isPending ? (mutation.variables?.id ?? null) : null}
                  onAdd={(item) => {
                    setAddedId(null);
                    mutation.mutate(item, { onSuccess: () => setAddedId(item.id) });
                  }}
                />
                {mutation.isError && (
                  <p role="alert" className="catalog:m-0 catalog:text-sm">
                    {mutation.error.message}
                  </p>
                )}
                {addedId === product.id && (
                  <p
                    role="status"
                    className="catalog:m-0 catalog:flex catalog:items-start catalog:gap-2 catalog:text-sm"
                  >
                    <Check size={16} aria-hidden="true" className="catalog:shrink-0" />
                    Добавлено: {product.title}
                  </p>
                )}
                {addedId === product.id && onNavigate && (
                  <Button variant="outline" onClick={() => onNavigate("cart")}>
                    Перейти в корзину
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
