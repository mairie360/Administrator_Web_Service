import { getStoredAuthorizationHeader } from "./auth-token";

export class BffRequestError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Erreur BFF (${status})`);
    this.name = "BffRequestError";
    this.status = status;
  }
}

function createRequestHeaders(init: RequestInit) {
  const headers = new Headers(init.headers);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!headers.has("Authorization")) {
    const authorizationHeader = getStoredAuthorizationHeader();

    if (authorizationHeader) {
      headers.set("Authorization", authorizationHeader);
    }
  }

  return headers;
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`/api/bff${path}`, {
    ...init,
    headers: createRequestHeaders(init),
  });

  if (!response.ok) {
    throw new BffRequestError(response.status);
  }

  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}
