import { navigateToLogin } from './logout';

export class BffRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Erreur BFF (${status})`);
    this.name = "BffRequestError";
    this.status = status;
  }
}

export class BffNavigationRequiredError extends Error {
  constructor() {
    super("Une redirection nécessite de rouvrir la page d’administration.");
    this.name = "BffNavigationRequiredError";
  }
}

function createRequestHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);
  headers.delete('Authorization');

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  const browserPath = path.startsWith('/api/') ? path : '/api/bff' + path;
  const response = await fetch(browserPath, {
    ...init,
    headers: createRequestHeaders(init),
    redirect: "manual",
    cache: 'no-store',
    credentials: 'same-origin',
  });

  init.signal?.throwIfAborted();

  // An opaque response exposes no safe destination or body. Return directly to
  // validated Login without revocation, repeated navigation or replaying a write.
  if (response.type === "opaqueredirect") {
    navigateToLogin();
    throw new BffNavigationRequiredError();
  }

  if (!response.ok) {
    if (response.status === 401) navigateToLogin();
    throw new BffRequestError(response.status);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.text();
  if (!body) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return body as T;

  return JSON.parse(body) as T;
}
