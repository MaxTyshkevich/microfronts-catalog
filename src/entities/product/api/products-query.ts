import { productsKey } from "@microfronts/contracts";
import { queryOptions } from "@tanstack/react-query";
import { request, type RequestContext } from "../../../shared/api";
import type { Product } from "../model/product";

export function productsQueryOptions(context: RequestContext) {
  return queryOptions({
    queryKey: productsKey(context.apiBaseUrl),
    queryFn: ({ signal }) => request<Product[]>(context, "/products", { signal }),
    staleTime: 60000,
    retry: false,
  });
}
