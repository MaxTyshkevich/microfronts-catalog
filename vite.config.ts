import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { resolveBuildEnvironment } from "./src/app/config/build-environment";

export default defineConfig(({ command, mode }) => {
  const env = { ...loadEnv(mode, ".", ""), ...process.env };
  const { origin, apiBaseUrl, base } = resolveBuildEnvironment(env, command, mode);
  const config = {
    schemaVersion: 1,
    apiBaseUrl,
  };
  const runtimeConfig: Plugin = {
    name: "microfronts-runtime-config",
    configureServer(server) {
      server.middlewares.use("/runtime-config.json", (_request, response) => {
        response.setHeader("Content-Type", "application/json");
        response.setHeader("Cache-Control", "no-store");
        response.end(JSON.stringify(config));
      });
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "runtime-config.json",
        source: JSON.stringify(config, null, 2),
      });
    },
  };
  const allowedOrigins = (
    env.DEV_ALLOWED_ORIGINS ||
    "http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:4173,http://localhost:4174,http://localhost:4175"
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const proxy = {
    "/api": { target: env.API_PROXY_TARGET || "http://localhost:3000", changeOrigin: true },
  };
  return {
    resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
    plugins: [
      tailwindcss(),
      react(),
      runtimeConfig,
      federation({
        name: "catalog",
        filename: "remoteEntry.js",
        exposes: { "./CatalogApp": "./src/CatalogApp.tsx" },
        dts: false,
        shared: {
          react: { singleton: true, requiredVersion: "^19.0.0" },
          "react-dom": { singleton: true, requiredVersion: "^19.0.0" },
          "react/jsx-runtime": { singleton: true, requiredVersion: "^19.0.0" },
          "react-dom/client": { singleton: true, requiredVersion: "^19.0.0" },
          "react-router": { singleton: true, requiredVersion: "7.18.4" },
        },
      }),
    ],
    base,
    server: { origin, port: 5174, strictPort: true, cors: { origin: allowedOrigins }, proxy },
    preview: { port: 4174, strictPort: true, cors: { origin: allowedOrigins }, proxy },
    build: { target: ["chrome111", "safari16.4", "firefox128"] },
  };
});
