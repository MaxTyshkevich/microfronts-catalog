import { queryOptions } from "@tanstack/react-query";
import { request, type RequestContext } from "../../../shared/api";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export function categoriesQueryOptions(context: RequestContext) {
  return queryOptions({
    queryKey: ["categories", context.apiBaseUrl],
    queryFn: ({ signal }) => request<Category[]>(context, "/categories", { signal }),
    staleTime: 60000,
    retry: false,
  });
}
