export interface Product {
  id: string;
  title: string;
  priceMinor: number;
  currency: string;
  badge?: string;
  description: string;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
  categoryId: string;
  category: { id: string; name: string; slug: string };
}
