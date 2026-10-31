import { QueryClient } from "@tanstack/react-query";
import "../styles/page-reset.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { getCartKey } from "../lib/cart-key";
import CatalogApp from "../ui/catalog-app";
import "../styles/standalone.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30000 }, mutations: { retry: false } },
});
const root = createRoot(document.getElementById("root")!);

fetch("/runtime-config.json", { cache: "no-store" })
  .then(async (response) => {
    if (!response.ok) throw new Error("Не удалось загрузить настройки");
    const config = await response.json();
    if (config.schemaVersion !== 1 || typeof config.apiBaseUrl !== "string")
      throw new Error("Неверный runtime config");
    const cartKey = getCartKey();
    root.render(
      <StrictMode>
        <main className="remote-page">
          <p>Standalone catalog · API: {config.apiBaseUrl}</p>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/catalog" replace />} />
              <Route
                path="/catalog/*"
                element={
                  <CatalogApp
                    apiBaseUrl={config.apiBaseUrl}
                    cartKey={cartKey}
                    queryClient={queryClient}
                  />
                }
              />
              <Route path="*" element={<Navigate to="/catalog" replace />} />
            </Routes>
          </BrowserRouter>
        </main>
      </StrictMode>,
    );
  })
  .catch((error: Error) => root.render(<p role="alert">{error.message}</p>));
