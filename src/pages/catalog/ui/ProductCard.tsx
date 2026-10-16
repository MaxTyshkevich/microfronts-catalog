import type { Product } from "../../../entities/product";
import { AddToCartButton } from "../../../features/add-to-cart";
import { formatMoney } from "../../../shared/lib";

interface Props {
  product: Product;
  pendingProductId: string | null;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, pendingProductId, onAdd }: Props) {
  return (
    <article className="product-card">
      <div>
        <h3>{product.title}</h3>
        {product.badge && <span>{product.badge}</span>}
      </div>
      <strong>{formatMoney(product.priceMinor, product.currency)}</strong>
      <AddToCartButton product={product} pendingProductId={pendingProductId} onAdd={onAdd} />
    </article>
  );
}
