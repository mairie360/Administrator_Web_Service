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

async function readBody<T>(response: Response) {
  if (response.status === 204) return undefined as T;

  const body = await response.text();
  if (!body) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return body as T;

  return JSON.parse(body) as T;
}

// Variante qui expose aussi les en-têtes de réponse (ex. `Authorization` renvoyé par un refresh).
export async function requestBffWithHeaders<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(path, {
    ...init,
    headers: createRequestHeaders(init),
  });

  if (!response.ok) {
    throw new BffRequestError(response.status);
  }

  return { data: await readBody<T>(response), headers: response.headers };
}

export async function requestBff<T>(path: string, init: RequestInit = {}) {
  return (await requestBffWithHeaders<T>(path, init)).data;
}
