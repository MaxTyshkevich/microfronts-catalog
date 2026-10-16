import type { CatalogProps } from "@microfronts/contracts";
import { CatalogQueryProvider } from "./app/providers/CatalogQueryProvider";
import { CatalogPage } from "./pages/catalog";
import "./app/styles/tailwind.css";

export default function CatalogApp(props: CatalogProps) {
  return (
    <CatalogQueryProvider queryClient={props.queryClient}>
      <CatalogPage {...props} />
    </CatalogQueryProvider>
  );
}
