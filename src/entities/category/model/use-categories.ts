import { useQuery } from "@tanstack/react-query";
import type { RequestContext } from "@/shared/api";
import { categoriesQueryOptions } from "../api/categories-query";

export function useCategories(context: RequestContext) {
  return useQuery(categoriesQueryOptions(context));
}
