import { useEffect, useState } from 'react';
import { Badge, Button } from '@microfronts/ui';
import { formatMoney, type Product, type RemoteProps } from '@microfronts/platform';
import './styles.css';

export default function CatalogApp({ platform }: RemoteProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    platform.request<Product[]>('/products', { signal: controller.signal })
      .then(setProducts)
      .catch((error: Error) => { if (!controller.signal.aborted) setError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [platform, attempt]);
  async function add(product: Product) {
    setPending(product.id); setError(''); setNotice('');
    try {
      await platform.request('/cart/items', { method: 'POST', body: JSON.stringify({ productId: product.id, quantity: 1 }) });
      platform.events.cartChanged();
      setNotice('Добавлено: ' + product.title);
    } catch (error) { setError(error instanceof Error ? error.message : 'Не удалось добавить товар'); }
    finally { setPending(null); }
  }
  return <section className="catalog" aria-label="Каталог">
    <div className="catalog-title"><Badge>catalog</Badge><p>Товары из API. Привет мир!</p></div>
    {loading && <p role="status">Загружаем каталог… Первый запуск API может занять минуту.</p>}
    {error && <div role="alert">{error} <Button onClick={() => setAttempt((value) => value + 1)}>Обновить каталог</Button></div>}
    <p role="status">{notice}</p>
    <div className="product-list">{products.map((product) => <article className="product-card" key={product.id}>
      <div><h3>{product.title}</h3>{product.badge && <span>{product.badge}</span>}</div>
      <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
      <Button disabled={pending !== null} onClick={() => void add(product)} aria-label={'Добавить ' + product.title}>
        {pending === product.id ? 'Добавляем…' : 'В корзину'}
      </Button>
    </article>)}</div>
  </section>;
}
