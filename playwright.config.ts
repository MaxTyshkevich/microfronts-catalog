import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  use: { baseURL: "http://127.0.0.1:5194", browserName: "chromium" },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js build --mode integration && node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5194 --strictPort",
    env: { VITE_PUBLIC_BASE: "http://127.0.0.1:5194/", VITE_API_BASE_URL: "/api" },
    url: "http://127.0.0.1:5194",
    reuseExistingServer: false,
  },
});
