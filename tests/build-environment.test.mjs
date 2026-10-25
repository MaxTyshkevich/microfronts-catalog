import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(
  new URL("../src/app/config/build-environment.ts", import.meta.url),
  "utf8",
);
const javascript = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { resolveBuildEnvironment: resolve } = await import(
  "data:text/javascript;base64," + Buffer.from(javascript).toString("base64")
);

test("Vercel production build uses its deployment URL and same-origin API", () => {
  assert.deepEqual(
    resolve({ VERCEL: "1", VERCEL_URL: "catalog-preview.vercel.app" }, "build", "production"),
    {
      origin: "http://localhost:5174",
      apiBaseUrl: "/api",
      base: "https://catalog-preview.vercel.app/",
    },
  );
});

test("explicit public base and API override Vercel defaults", () => {
  assert.equal(
    resolve(
      {
        VERCEL: "1",
        VERCEL_URL: "catalog-preview.vercel.app",
        VITE_PUBLIC_BASE: "https://cdn.example.com/catalog/",
        VITE_API_BASE_URL: "https://api.example.com/api",
      },
      "build",
      "production",
    ).base,
    "https://cdn.example.com/catalog/",
  );
  assert.equal(
    resolve(
      {
        VITE_PUBLIC_BASE: "https://catalog.example.com/",
        VITE_API_BASE_URL: "https://api.example.com/api",
      },
      "build",
      "production",
    ).apiBaseUrl,
    "https://api.example.com/api",
  );
});

test("production rejects missing or malformed public URLs without bypassing an explicit override", () => {
  for (const env of [
    {},
    { VERCEL_URL: "catalog-preview.vercel.app" },
    { VERCEL: "1" },
    ...[
      "https://catalog.vercel.app",
      "catalog.vercel.app/path",
      "user@catalog.vercel.app",
      "not a hostname",
    ].map((VERCEL_URL) => ({ VERCEL: "1", VERCEL_URL })),
    ...["http://catalog.example.com/", "https://", "/"].map((VITE_PUBLIC_BASE) => ({
      VERCEL: "1",
      VERCEL_URL: "catalog-preview.vercel.app",
      VITE_PUBLIC_BASE,
    })),
  ])
    assert.throws(
      () => resolve(env, "build", "production"),
      /Production requires HTTPS VITE_PUBLIC_BASE/,
    );
});

test("production rejects HTTP and malformed API URLs", () => {
  for (const VITE_API_BASE_URL of ["http://api.example.com/api", "https://", "/other"]) {
    assert.throws(
      () =>
        resolve(
          { VERCEL: "1", VERCEL_URL: "catalog-preview.vercel.app", VITE_API_BASE_URL },
          "build",
          "production",
        ),
      /Production requires \/api or HTTPS VITE_API_BASE_URL/,
    );
  }
});

test("development and integration builds preserve local defaults even with Vercel variables", () => {
  const env = { VERCEL: "1", VERCEL_URL: "catalog-preview.vercel.app" };
  assert.equal(resolve(env, "serve", "development").base, "http://localhost:5174/");
  assert.equal(resolve(env, "build", "integration").base, "http://localhost:4174/");
  assert.equal(
    resolve({ ...env, VITE_PUBLIC_BASE: "http://127.0.0.1:5194/" }, "build", "integration").base,
    "http://127.0.0.1:5194/",
  );
});
