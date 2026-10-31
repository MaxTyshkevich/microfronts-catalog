import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ArrowRight, Check, LayoutGrid, PackageSearch } from "lucide-react";
import type { CatalogProps } from "@microfronts/contracts";
import { useProducts, ProductCard, type Product } from "../../../entities/product";
import { useCategories } from "../../../entities/category";
import { HttpError } from "../../../shared/api";
import { Button, Card, CardContent, CardHeader, Skeleton } from "../../../shared/ui";
import { useAddToCart, AddToCartButton } from "../../../features/add-to-cart";
import { CreateProductDialog } from "../../../features/create-product";

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
  const categoryMissing =
    productsQuery.error instanceof HttpError && productsQuery.error.status === 404;
  const selectedCategory = categoriesQuery.data?.find((item) => item.slug === category);

  function selectAll() {
    setNotice("");
    setSearch((previous) => {
      const next = new URLSearchParams(previous);
      next.delete("category");
      return next;
    });
  }

  function add(product: Product) {
    setNotice("");
    mutation.mutate(product, { onSuccess: () => setNotice("Добавлено: " + product.title) });
  }

  return (
    <section className="catalog:grid catalog:gap-8 catalog:py-2" aria-label="Каталог">
      <header className="catalog:grid catalog:gap-3 catalog:border-b catalog:border-border catalog:pb-6">
        <span className="catalog:w-fit catalog:rounded-full catalog:bg-muted catalog:px-3 catalog:py-1 catalog:text-xs catalog:font-medium">
          Каталог
        </span>
        <h1 className="catalog:m-0 catalog:text-3xl catalog:font-semibold catalog:tracking-tight catalog:sm:text-4xl">
          Товары
        </h1>
        <p className="catalog:m-0 catalog:max-w-xl catalog:text-muted-foreground catalog:leading-relaxed">
          Всё для удобной работы. Выберите категорию или посмотрите весь каталог.
        </p>
        <CreateProductDialog context={context} />
      </header>
      <div className="catalog:grid catalog:items-start catalog:gap-6 catalog:md:grid-cols-[190px_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <h2 className="catalog:m-0 catalog:text-base catalog:font-semibold">Категории</h2>
          </CardHeader>
          <CardContent>
            <aside className="catalog:grid catalog:gap-2" aria-label="Категории товаров">
              <Button
                variant={category === undefined ? "default" : "ghost"}
                className="catalog:justify-start catalog:whitespace-normal catalog:text-left"
                aria-pressed={category === undefined}
                onClick={selectAll}
              >
                <LayoutGrid size={16} aria-hidden="true" className="catalog:shrink-0" />
                Все товары
              </Button>
              {categoriesQuery.isPending && (
                <div
                  role="status"
                  aria-label="Загружаем категории"
                  className="catalog:grid catalog:gap-2"
                >
                  <Skeleton className="catalog:h-10 catalog:w-full" />
                  <Skeleton className="catalog:h-10 catalog:w-full" />
                </div>
              )}
              {categoriesQuery.isError && (
                <div role="alert" className="catalog:grid catalog:gap-3 catalog:text-sm">
                  <p className="catalog:m-0">Не удалось загрузить категории.</p>
                  <Button
                    variant="outline"
                    className="catalog:whitespace-normal"
                    onClick={() => void categoriesQuery.refetch()}
                  >
                    Повторить загрузку категорий
                  </Button>
                </div>
              )}
              {(categoriesQuery.data ?? []).map((item) => (
                <Button
                  key={item.id}
                  asChild
                  variant={category === item.slug ? "outline" : "ghost"}
                  className="catalog:justify-start catalog:whitespace-normal catalog:text-left"
                >
                  <Link to={"/catalog/category/" + encodeURIComponent(item.slug)}>{item.name}</Link>
                </Button>
              ))}
            </aside>
          </CardContent>
        </Card>
        <div className="catalog:grid catalog:min-w-0 catalog:gap-4">
          <div className="catalog:flex catalog:flex-wrap catalog:items-center catalog:justify-between catalog:gap-2">
            <h2 className="catalog:m-0 catalog:text-lg catalog:font-semibold">
              {selectedCategory?.name ?? (category ? "Товары категории" : "Все товары")}
            </h2>
            {productsQuery.isSuccess && (
              <span className="catalog:text-sm catalog:text-muted-foreground">
                Товаров: {productsQuery.data.length}
              </span>
            )}
          </div>
          {productsQuery.isPending && (
            <div
              role="status"
              aria-label="Загружаем каталог"
              className="catalog:grid catalog:gap-4 catalog:sm:grid-cols-2"
            >
              <span className="catalog:sr-only">
                Загружаем каталог… Первый запуск API может занять минуту.
              </span>
              {[0, 1, 2, 3].map((item) => (
                <Skeleton key={item} className="catalog:h-64 catalog:w-full catalog:rounded-xl" />
              ))}
            </div>
          )}
          {productsQuery.isError && (
            <Card role="alert">
              <CardHeader>
                <h3 className="catalog:m-0 catalog:text-lg catalog:font-semibold">
                  {categoryMissing ? "Категория не найдена" : "Не удалось загрузить каталог"}
                </h3>
              </CardHeader>
              <CardContent className="catalog:grid catalog:justify-items-start catalog:gap-4">
                <p className="catalog:m-0 catalog:text-sm catalog:text-muted-foreground">
                  {productsQuery.error.message}
                </p>
                <Button variant="outline" onClick={() => void productsQuery.refetch()}>
                  Обновить каталог
                </Button>
              </CardContent>
            </Card>
          )}
          {notice && (
            <div
              role="status"
              className="catalog:flex catalog:items-center catalog:gap-2 catalog:rounded-lg catalog:border catalog:border-border catalog:bg-muted catalog:p-4 catalog:text-sm"
            >
              <Check size={16} aria-hidden="true" className="catalog:shrink-0" />
              {notice}
            </div>
          )}
          {mutation.isError && (
            <p role="alert" className="catalog:m-0 catalog:text-sm">
              {mutation.error.message}
            </p>
          )}
          {onNavigate && notice && (
            <Button className="catalog:w-fit" variant="outline" onClick={() => onNavigate("cart")}>
              Перейти в корзину
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
          {productsQuery.isSuccess && productsQuery.data.length === 0 && (
            <Card>
              <CardHeader className="catalog:items-center catalog:py-10 catalog:text-center">
                <PackageSearch
                  size={32}
                  aria-hidden="true"
                  className="catalog:mb-2 catalog:text-muted-foreground"
                />
                <h3 className="catalog:m-0 catalog:text-lg catalog:font-semibold">
                  В этой категории пока нет товаров.
                </h3>
                <p className="catalog:m-0 catalog:text-sm catalog:text-muted-foreground">
                  Выберите другую категорию или вернитесь ко всем товарам.
                </p>
                <Button variant="outline" className="catalog:mt-4" onClick={selectAll}>
                  Смотреть все товары
                </Button>
              </CardHeader>
            </Card>
          )}
          {productsQuery.isSuccess && productsQuery.data.length > 0 && (
            <div className="catalog:grid catalog:gap-4 catalog:sm:grid-cols-2 catalog:md:grid-cols-1 catalog:lg:grid-cols-2">
              {productsQuery.data.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  detailsHref={
                    "/catalog/products/" +
                    encodeURIComponent(product.id) +
                    (search.size ? "?" + search.toString() : "")
                  }
                  action={
                    <AddToCartButton
                      product={product}
                      pendingProductId={pendingProductId}
                      onAdd={add}
                    />
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
