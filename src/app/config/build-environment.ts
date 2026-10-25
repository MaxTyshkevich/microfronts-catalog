type Environment = Record<string, string | undefined>;

function isHttpsUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}

function vercelBase(env: Environment): string | undefined {
  if (env.VERCEL !== "1" || !env.VERCEL_URL) return undefined;
  try {
    const url = new URL("https://" + env.VERCEL_URL);
    // VERCEL_URL is a deployment hostname, without scheme, path or credentials.
    return url.host === env.VERCEL_URL && !url.username && !url.password
      ? url.origin + "/"
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolveBuildEnvironment(env: Environment, command: string, mode: string) {
  const isProduction = command === "build" && mode !== "integration";
  const origin = env.DEV_PUBLIC_ORIGIN || "http://localhost:5174";
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api";
  const publicBase = env.VITE_PUBLIC_BASE || (isProduction ? vercelBase(env) : undefined);

  if (isProduction) {
    if (!isHttpsUrl(publicBase)) {
      throw new Error(
        "Production requires HTTPS VITE_PUBLIC_BASE or VERCEL=1 with a valid VERCEL_URL",
      );
    }
    if (apiBaseUrl !== "/api" && !isHttpsUrl(apiBaseUrl)) {
      throw new Error("Production requires /api or HTTPS VITE_API_BASE_URL");
    }
  }

  return {
    origin,
    apiBaseUrl,
    base: command === "serve" ? origin + "/" : publicBase || "http://localhost:4174/",
  };
}
