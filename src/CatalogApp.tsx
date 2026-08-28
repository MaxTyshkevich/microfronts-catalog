import { Badge } from "@microfronts/ui";
import "./styles.css";

type Product = {
  id: string;
  title: string;
  price: number;
  badge?: string;
};

const products: Product[] = [
  { id: "keyboard", title: "Split keyboard", price: 149, badge: "new" },
  { id: "monitor", title: "Portable monitor", price: 229 },
  { id: "dock", title: "USB-C dock", price: 119, badge: "team pick" }
];

export default function CatalogApp() {
  return (
    <div className="catalog">
      <div className="remote-title">
        <Badge>catalog</Badge>
        <p>Товары приходят из отдельного remote-приложения.</p>
        <p>Привет мир</p>
      </div>

      <div className="product-list">
        {products.map((product) => (
          <article className="product-card" key={product.id}>
            <div>
              <h3>{product.title}</h3>
              {product.badge ? <span>{product.badge}</span> : null}
            </div>
            <strong>${product.price}</strong>
          </article>
        ))}
      </div>
    </div>
  );
}
