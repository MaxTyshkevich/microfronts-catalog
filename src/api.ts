// Local HTTP helper. No shared singleton, event bus, or dependency on shell.
export async function request<T>(
  apiBaseUrl: string,
  cartKey: string,
  path: string,
  options: RequestInit = {}, sessionScope?: string, onUnauthorized?: () => void,
): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, 90000);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("X-Cart-Key", cartKey);
  headers.set("X-Requested-With", "microfronts");
  if (sessionScope) headers.set("X-Session-User", sessionScope.startsWith("user:") ? sessionScope.slice(5) : "guest");
  try {
    const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
      ...options, credentials: sessionScope ? "include" : "omit", signal: controller.signal, headers,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 410) onUnauthorized?.();
      const body = await response.json().catch(() => null);
      throw new Error(typeof body?.message === "string" ? body.message : `API: HTTP ${response.status}`);
    }
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}

export function formatMoney(minor: number, currency = "USD") {
  return new Intl.NumberFormat("ru-RU", { style: "currency", currency }).format(minor / 100);
}
