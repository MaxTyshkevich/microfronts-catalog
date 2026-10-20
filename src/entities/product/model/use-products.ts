import { useQuery } from "@tanstack/react-query";
import type { RequestContext } from "../../../shared/api";
import { productsQueryOptions } from "../api/products-query";

export function useProducts(context: RequestContext) {
  return useQuery(productsQueryOptions(context));
}
