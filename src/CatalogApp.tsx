import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { productsKey, cartKey as sharedCartKey } from "@microfronts/contracts";
import { useState } from "react";
import { Badge, Button } from "@microfronts/ui";
import { formatMoney, request } from "./api";
import type { CatalogProps } from "./remote-props";
import type { Product } from "./models";
import "./app/styles/tailwind.css";
import "./app/styles/remote.css";

export default function CatalogApp(props: CatalogProps) {
  const [localClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
      }),
  );
  return (
    <QueryClientProvider client={props.queryClient ?? localClient}>
      <CatalogContent {...props} />
    </QueryClientProvider>
  );
}
function CatalogContent({
  apiBaseUrl,
  cartKey,
  sessionScope,
  onUnauthorized,
  onCartChanged,
  onNavigate,
}: CatalogProps) {
  const client = useQueryClient();
  const scope = sessionScope ?? "guest:" + cartKey;
  const [notice, setNotice] = useState("");
  const productsQuery = useQuery({
    queryKey: productsKey(apiBaseUrl),
    queryFn: ({ signal }) =>
      request<Product[]>(
        apiBaseUrl,
        cartKey,
        "/products",
        { signal },
        sessionScope,
        onUnauthorized,
      ),
    staleTime: 60000,
    retry: false,
  });
  const mutation = useMutation({
    mutationKey: ["cart-write", apiBaseUrl, scope],
    scope: { id: "cart:" + scope },
    retry: false,
    mutationFn: (product: Product) =>
      request(
        apiBaseUrl,
        cartKey,
        "/cart/items",
        {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1 }),
        },
        sessionScope,
        onUnauthorized,
      ),
    onSuccess: async (_, product) => {
      await client.invalidateQueries({ queryKey: sharedCartKey(apiBaseUrl, scope) });
      onCartChanged?.();
      setNotice("Добавлено: " + product.title);
    },
  });
  const products = productsQuery.data ?? [];
  const loading = productsQuery.isPending;
  const error = productsQuery.error?.message ?? mutation.error?.message;
  const pending = mutation.isPending ? mutation.variables?.id : null;
  function add(product: Product) {
    setNotice("");
    mutation.mutate(product);
  }
  return (
    <section className="catalog catalog:grid catalog:gap-[18px]" aria-label="Каталог">
      <div className="catalog-title">
        <Badge>catalog</Badge>
        <p>Товары из API. Привет мир!</p>
      </div>
      {loading && <p role="status">Загружаем каталог… Первый запуск API может занять минуту.</p>}
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
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div>
              <h3>{product.title}</h3>
              {product.badge && <span>{product.badge}</span>}
            </div>
            <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
            <Button
              disabled={pending !== null}
              onClick={() => void add(product)}
              aria-label={"Добавить " + product.title}
            >
              {pending === product.id ? "Добавляем…" : "В корзину"}
            </Button>
          </article>
        ))}
      </div>
    </section>
  );
}
