export interface RequestContext {
  apiBaseUrl: string;
  cartKey: string;
  sessionScope?: string;
  onUnauthorized?: () => void;
}

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export async function request<T>(
  context: RequestContext,
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { apiBaseUrl, cartKey, sessionScope, onUnauthorized } = context;
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) abort();
  const timer = setTimeout(abort, 90000);
  const headers = new Headers(options.headers);
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  headers.set("X-Cart-Key", cartKey);
  headers.set("X-Requested-With", "microfronts");
  if (sessionScope)
    headers.set(
      "X-Session-User",
      sessionScope.startsWith("user:") ? sessionScope.slice(5) : "guest",
    );
  try {
    const response = await fetch(apiBaseUrl.replace(/\/$/, "") + path, {
      ...options,
      credentials: options.credentials ?? (sessionScope ? "include" : "omit"),
      signal: controller.signal,
      headers,
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 410) onUnauthorized?.();
      const body = await response.json().catch(() => null);
      throw new HttpError(
        response.status,
        typeof body?.message === "string" ? body.message : "API: HTTP " + response.status,
      );
    }
    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", abort);
  }
}
