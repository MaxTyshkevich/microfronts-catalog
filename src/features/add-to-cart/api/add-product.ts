import { request, type RequestContext } from "../../../shared/api";

export function addProduct(context: RequestContext, productId: string) {
  return request<unknown>(context, "/cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
}
