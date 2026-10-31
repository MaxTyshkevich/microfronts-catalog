import { request, type RequestContext } from "@/shared/api";
import type { Product } from "@/entities/product";

export interface CreateProduct {
  id: string;
  title: string;
  description: string;
  priceMinor: number;
  categoryId: string;
}

export function createProduct(context: RequestContext, product: CreateProduct) {
  return request<Product>(context, "/products", {
    method: "POST",
    credentials: "include",
    body: JSON.stringify(product),
  });
}
