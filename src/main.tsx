import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CatalogApp from "./CatalogApp";
import "./standalone.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <main className="remote-page">
      <CatalogApp />
    </main>
  </StrictMode>
);
