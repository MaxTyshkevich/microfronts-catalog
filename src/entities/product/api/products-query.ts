import { productsKey } from "@microfronts/contracts";
import { queryOptions } from "@tanstack/react-query";
import { request, type RequestContext } from "../../../shared/api";
import type { Product } from "../model/product";

export function productsQueryOptions(context: RequestContext, category?: string) {
  return queryOptions({
    queryKey:
      category === undefined
        ? productsKey(context.apiBaseUrl)
        : [...productsKey(context.apiBaseUrl), { category }],
    queryFn: ({ signal }) =>
      request<Product[]>(
        context,
        "/products" + (category === undefined ? "" : "?category=" + encodeURIComponent(category)),
        { signal },
      ),
    staleTime: 60000,
    retry: false,
  });
}

export function productQueryOptions(context: RequestContext, id: string) {
  return queryOptions({
    queryKey: ["product", context.apiBaseUrl, id],
    queryFn: ({ signal }) =>
      request<Product>(context, "/products/" + encodeURIComponent(id), { signal }),
    staleTime: 60000,
    retry: false,
  });
}
