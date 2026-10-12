import { navigateToLogin } from './logout';

export type BffErrorDetail = { path?: string; message: string };

export class BffRequestError extends Error {
  readonly status: number;
  /** `error.details[]` of the shared ErrorResponse envelope, for field-level messages (MAIR-514). */
  readonly details: readonly BffErrorDetail[];

  constructor(status: number, body?: unknown) {
    super(`Erreur BFF (${status})`);
    this.name = "BffRequestError";
    this.status = status;
    const details = (body as { error?: { details?: unknown } } | null | undefined)?.error?.details;
    this.details = Array.isArray(details)
      ? details.flatMap((detail: unknown) => {
        const item = detail as { path?: unknown; message?: unknown } | null;
        return typeof item?.message === "string"
          ? [{ path: typeof item.path === "string" ? item.path : undefined, message: item.message }]
          : [];
      })
      : [];
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

/** The ErrorResponse envelope of a refusal, when the body is JSON; never throws. */
async function readErrorBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
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
    throw new BffRequestError(response.status, await readErrorBody(response));
  }

  if (response.status === 204) return undefined as T;

  const body = await response.text();
  if (!body) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return body as T;

  return JSON.parse(body) as T;
}
