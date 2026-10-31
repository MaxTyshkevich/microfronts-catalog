import type { CatalogProps } from "@microfronts/contracts";
import { CatalogQueryProvider } from "../providers/CatalogQueryProvider";
import { CatalogRoutes } from "../routes/catalog-routes";
import "../styles/tailwind.css";

export default function CatalogApp(props: CatalogProps) {
  return (
    <CatalogQueryProvider queryClient={props.queryClient}>
      <div className="catalog-ui">
        <CatalogRoutes {...props} />
      </div>
    </CatalogQueryProvider>
  );
}
