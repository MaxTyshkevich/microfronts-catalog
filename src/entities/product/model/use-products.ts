import { useQuery } from "@tanstack/react-query";
import type { RequestContext } from "@/shared/api";
import { productsQueryOptions, productQueryOptions } from "../api/products-query";

export function useProducts(context: RequestContext, category?: string) {
  return useQuery(productsQueryOptions(context, category));
}

export function useProduct(context: RequestContext, id: string) {
  return useQuery(productQueryOptions(context, id));
}
