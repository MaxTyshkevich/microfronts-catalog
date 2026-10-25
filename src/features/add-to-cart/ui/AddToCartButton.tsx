import { Button } from "../../../shared/ui";
import type { Product } from "../../../entities/product";

interface Props {
  product: Product;
  pendingProductId: string | null;
  onAdd: (product: Product) => void;
}

export function AddToCartButton({ product, pendingProductId, onAdd }: Props) {
  return (
    <Button disabled={pendingProductId !== null} onClick={() => onAdd(product)} aria-label={"Добавить " + product.title}>
      {pendingProductId === product.id ? "Добавляем…" : "В корзину"}
    </Button>
  );
}
