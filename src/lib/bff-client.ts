import { sessionFetch } from '@mairie360/front-kit/browser';
import axios, { type AxiosAdapter } from 'axios';
import { getBffUser } from '@mairie360/bff-user-openapi/endpoints/bffUser';
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
  const response = await sessionFetch(path, {
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

// The generated operations of the published BFF User contract own every path: axios only carries the
// request through requestBff, which keeps the same-origin cookie, redirect and 401 handling.
const contractAdapter: AxiosAdapter = async (config) => {
  const data = await requestBff<unknown>(axios.getUri(config), {
    method: (config.method ?? 'get').toUpperCase(),
    headers: config.headers.toJSON() as Record<string, string>,
    body: typeof config.data === 'string' ? config.data : undefined,
    signal: (config.signal as AbortSignal | undefined) ?? undefined,
  });
  return {
    data,
    status: data === undefined ? 204 : 200,
    statusText: data === undefined ? 'No Content' : 'OK',
    headers: {},
    config,
  };
};

export const bffUser = getBffUser(axios.create({ adapter: contractAdapter, headers: { Accept: 'application/json' } }));
