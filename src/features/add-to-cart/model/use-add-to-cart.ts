import { cartKey as sharedCartKey } from "@microfronts/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "../../../entities/product";
import type { RequestContext } from "../../../shared/api";
import { addProduct } from "../api/add-product";

export function useAddToCart(context: RequestContext, onCartChanged?: () => void) {
  const client = useQueryClient();
  const scope = context.sessionScope ?? "guest:" + context.cartKey;
  return useMutation({
    mutationKey: ["cart-write", context.apiBaseUrl, scope],
    scope: { id: "cart:" + scope },
    retry: false,
    mutationFn: (product: Product) => addProduct(context, product.id),
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: sharedCartKey(context.apiBaseUrl, scope) });
      onCartChanged?.();
    },
  });
}
