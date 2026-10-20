import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import type { CatalogProps } from "@microfronts/contracts";

export function CatalogQueryProvider({ queryClient, children }: { queryClient?: CatalogProps["queryClient"]; children: ReactNode }) {
  const [localClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  }));
  return <QueryClientProvider client={queryClient ?? localClient}>{children}</QueryClientProvider>;
}
