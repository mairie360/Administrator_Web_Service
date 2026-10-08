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

const navigatingLocations = new WeakSet<Location>();

function createRequestHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: createRequestHeaders(init),
    redirect: "manual",
  });

  init.signal?.throwIfAborted();

  // An opaque response exposes no safe destination or body. Reopen the current
  // protected document so the existing middleware owns Login and its return URL.
  // Concurrent reads must not navigate repeatedly or replay a submitted write.
  if (response.type === "opaqueredirect") {
    if (typeof window !== "undefined" && !navigatingLocations.has(window.location)) {
      navigatingLocations.add(window.location);
      window.location.reload();
    }
    throw new BffNavigationRequiredError();
  }

  if (!response.ok) {
    throw new BffRequestError(response.status);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.text();
  if (!body) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return body as T;

  return JSON.parse(body) as T;
}
