import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "catalog",
      filename: "remoteEntry.js",
      exposes: {
        "./CatalogApp": "./src/CatalogApp.tsx"
      },
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true }
      }
    })
  ],
  server: {
    origin: "http://localhost:5174",
    port: 5174
  },
  base: "http://localhost:5174/",
  build: {
    target: "chrome89"
  }
});
