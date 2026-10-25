import { useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, ArrowRight, ChevronRight, Check } from "lucide-react";
import type { CatalogProps } from "@microfronts/contracts";
import { getCategoryContent, useCategories } from "../../../entities/category";
import { ProductCard, useProducts, type Product } from "../../../entities/product";
import { AddToCartButton, useAddToCart } from "../../../features/add-to-cart";
import { Button, Card, CardContent, CardHeader, Skeleton } from "../../../shared/ui";
import { HttpError } from "../../../shared/api";

export function CategoryPage(props: CatalogProps) {
  const { slug = "" } = useParams();
  return <CategoryDetails key={slug} {...props} slug={slug} />;
}

function CategoryDetails({
  slug,
  apiBaseUrl,
  cartKey,
  sessionScope,
  onUnauthorized,
  onCartChanged,
  onNavigate,
}: CatalogProps & { slug: string }) {
  const context = { apiBaseUrl, cartKey, sessionScope, onUnauthorized };
  const categories = useCategories(context);
  const products = useProducts(context, slug);
  const mutation = useAddToCart(context, onCartChanged);
  const [notice, setNotice] = useState("");
  const category = categories.data?.find((item) => item.slug === slug);
  const content = getCategoryContent(slug);
  const missing =
    (categories.isSuccess && !category) ||
    (products.error instanceof HttpError && products.error.status === 404);
  const productSearch = "?category=" + encodeURIComponent(slug) + "&from=category";

  function add(product: Product) {
    setNotice("");
    mutation.mutate(product, { onSuccess: () => setNotice("Добавлено: " + product.title) });
  }

  return (
    <section aria-label="Описание категории" className="catalog:grid catalog:gap-8 catalog:py-2">
      <nav aria-label="Путь к категории">
        <ol className="catalog:m-0 catalog:flex catalog:list-none catalog:flex-wrap catalog:items-center catalog:gap-2 catalog:p-0 catalog:text-sm catalog:text-muted-foreground">
          <li>
            <Link className="catalog:underline-offset-4 catalog:hover:underline" to="/catalog">
              Каталог
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight size={14} />
          </li>
          <li aria-current="page">{category?.name ?? "Категория"}</li>
        </ol>
      </nav>

      {missing ? (
        <Card>
          <CardHeader>
            <h1 className="catalog:m-0 catalog:text-2xl catalog:font-semibold">
              Категория не найдена
            </h1>
          </CardHeader>
          <CardContent>
            <p>Проверьте адрес или выберите другую категорию в каталоге.</p>
            <Button asChild variant="outline">
              <Link to="/catalog">
                <ArrowLeft size={16} aria-hidden="true" />
                Все товары
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : categories.isError ? (
        <Card role="alert">
          <CardHeader>
            <h1 className="catalog:m-0 catalog:text-2xl catalog:font-semibold">
              Не удалось загрузить категорию
            </h1>
          </CardHeader>
          <CardContent>
            <p>{categories.error.message}</p>
            <Button onClick={() => void categories.refetch()}>Повторить загрузку категории</Button>
          </CardContent>
        </Card>
      ) : categories.isPending ? (
        <div role="status" aria-label="Загружаем категорию" className="catalog:grid catalog:gap-4">
          <Skeleton className="catalog:h-12 catalog:w-2/3" />
          <Skeleton className="catalog:h-24 catalog:w-full" />
          <Skeleton className="catalog:h-48 catalog:w-full" />
        </div>
      ) : (
        category && (
          <>
            <header className="catalog:grid catalog:gap-4 catalog:border-b catalog:border-border catalog:pb-8">
              <span className="catalog:w-fit catalog:rounded-full catalog:bg-muted catalog:px-3 catalog:py-1 catalog:text-xs catalog:font-medium">
                Категория товаров
              </span>
              <h1 className="catalog:m-0 catalog:text-3xl catalog:font-semibold catalog:tracking-tight catalog:sm:text-4xl">
                {category.name}
              </h1>
              <p className="catalog:m-0 catalog:max-w-2xl catalog:text-lg catalog:leading-relaxed catalog:text-muted-foreground">
                {content.introduction}
              </p>
              <div className="catalog:flex catalog:flex-wrap catalog:gap-3">
                <Button asChild>
                  <a href="#category-products">
                    Смотреть товары
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/catalog">
                    <ArrowLeft size={16} aria-hidden="true" />
                    Весь каталог
                  </Link>
                </Button>
              </div>
            </header>

            <div className="catalog:grid catalog:gap-6 catalog:lg:grid-cols-2">
              <div className="catalog:py-2">
                <h2 className="catalog:mt-0 catalog:mb-4 catalog:text-xl catalog:font-semibold">
                  О категории
                </h2>
                <p className="catalog:m-0 catalog:text-base catalog:leading-7 catalog:text-muted-foreground">
                  {content.description}
                </p>
              </div>
              <Card className="catalog:bg-muted/40">
                <CardHeader>
                  <h2 className="catalog:m-0 catalog:text-lg catalog:font-semibold">
                    На что обратить внимание
                  </h2>
                </CardHeader>
                <CardContent>
                  <ul className="catalog:m-0 catalog:grid catalog:list-none catalog:gap-4 catalog:p-0">
                    {content.tips.map((tip) => (
                      <li
                        key={tip}
                        className="catalog:flex catalog:items-start catalog:gap-3 catalog:text-sm catalog:leading-relaxed"
                      >
                        <Check
                          size={16}
                          aria-hidden="true"
                          className="catalog:mt-1 catalog:shrink-0"
                        />
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            <section
              id="category-products"
              aria-labelledby="category-products-title"
              className="catalog:grid catalog:scroll-mt-6 catalog:gap-5"
            >
              <div className="catalog:flex catalog:flex-wrap catalog:items-center catalog:justify-between catalog:gap-3">
                <h2
                  id="category-products-title"
                  className="catalog:m-0 catalog:text-2xl catalog:font-semibold catalog:tracking-tight"
                >
                  Товары категории
                </h2>
                {products.isSuccess && (
                  <span className="catalog:text-sm catalog:text-muted-foreground">
                    Товаров: {products.data.length}
                  </span>
                )}
              </div>
              {products.isPending && (
                <div
                  role="status"
                  aria-label="Загружаем товары"
                  className="catalog:grid catalog:gap-4 catalog:sm:grid-cols-2"
                >
                  <Skeleton className="catalog:h-56" />
                  <Skeleton className="catalog:h-56" />
                </div>
              )}
              {products.isError && (
                <Card role="alert">
                  <CardHeader>
                    <h3 className="catalog:m-0 catalog:font-semibold">
                      Не удалось загрузить товары
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p>{products.error.message}</p>
                    <Button onClick={() => void products.refetch()}>
                      Повторить загрузку товаров
                    </Button>
                  </CardContent>
                </Card>
              )}
              {products.isSuccess && products.data.length === 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="catalog:m-0 catalog:text-lg catalog:font-semibold">
                      В этой категории пока нет товаров.
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="catalog:mt-0 catalog:text-muted-foreground">
                      Посмотрите другие категории — возможно, нужный товар уже там.
                    </p>
                    <Button asChild variant="outline">
                      <Link to="/catalog">Перейти в каталог</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
              <p role="status" className="catalog:m-0 catalog:text-sm">
                {notice}
              </p>
              {mutation.isError && <p role="alert">{mutation.error.message}</p>}
              {notice && onNavigate && (
                <Button
                  className="catalog:w-fit"
                  variant="outline"
                  onClick={() => onNavigate("cart")}
                >
                  Перейти в корзину
                </Button>
              )}
              {products.isSuccess && (
                <div className="catalog:grid catalog:gap-4 catalog:sm:grid-cols-2">
                  {products.data.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      detailsHref={
                        "/catalog/products/" + encodeURIComponent(product.id) + productSearch
                      }
                      action={
                        <AddToCartButton
                          product={product}
                          pendingProductId={
                            mutation.isPending ? (mutation.variables?.id ?? null) : null
                          }
                          onAdd={add}
                        />
                      }
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )
      )}
    </section>
  );
}
