import type { CatalogProps } from "@microfronts/contracts";
import { CatalogQueryProvider } from "./app/providers/CatalogQueryProvider";
import { CatalogRoutes } from "./app/routes/catalog-routes";
import "./app/styles/tailwind.css";

export default function CatalogApp(props: CatalogProps) {
  return (
    <CatalogQueryProvider queryClient={props.queryClient}>
      <CatalogRoutes {...props} />
    </CatalogQueryProvider>
  );
}
