import { Link, Route, Routes } from "react-router";
import type { CatalogProps } from "@microfronts/contracts";
import { CatalogPage } from "../../pages/catalog";
import { ProductPage } from "../../pages/product";
import { CategoryPage } from "../../pages/category";

export function CatalogRoutes(props: CatalogProps) {
  return (
    <Routes>
      <Route index element={<CatalogPage {...props} />} />
      <Route path="category/:slug" element={<CategoryPage {...props} />} />
      <Route path="products/:productId" element={<ProductPage {...props} />} />
      <Route
        path="*"
        element={
          <section>
            <h2>Страница не найдена</h2>
            <Link to="/catalog">Все товары</Link>
          </section>
        }
      />
    </Routes>
  );
}
