import type { Product } from "../../../entities/product";
import { AddToCartButton } from "../../../features/add-to-cart";
import { formatMoney } from "../../../shared/lib";
import { Link, useLocation } from "react-router";

interface Props {
  product: Product;
  pendingProductId: string | null;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, pendingProductId, onAdd }: Props) {
  const { search } = useLocation();
  return (
    <article className="product-card">
      <div>
        <h3>
          <Link to={"/catalog/products/" + encodeURIComponent(product.id) + search}>
            {product.title}
          </Link>
        </h3>
        <p>{product.category.name}</p>
        {product.badge && <span>{product.badge}</span>}
      </div>
      <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
      <AddToCartButton product={product} pendingProductId={pendingProductId} onAdd={onAdd} />
    </article>
  );
}
