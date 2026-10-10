import { NextRequest } from 'next/server';
import { createSessionLogoutProxy, proxyPublishedBffRequest } from '@mairie360/lib-components/next';
import contract from '../../contracts/openapi.json';

type RouteContext = { params: Promise<{ path: string[] }> };

const logoutProxy = createSessionLogoutProxy({
  loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',
  frontUrl: () => process.env.ADMINISTRATION_FRONT_URL?.trim() ?? '',
});

export function configuredBffUrl() {
  const value = (process.env.BFF_ADMIN_BASE_URL ??
    process.env.USER_BFF_URL ??
    process.env.BFF_USER_API_URL ??
    process.env.NEXT_PUBLIC_BFF_ADMIN_BASE_URL)?.trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) return '';
    return value.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

/** Every relay uses the published User paths and the same Login session owner. */
export async function forwardToBff(request: NextRequest, baseUrl: string, path: string) {
  if (request.method === 'POST' && path === '/auth/logout') return logoutProxy(request);
  // Login owns authentication operations; Administration exposes its published
  // business and profile routes without offering a second authentication entry.
  if (path.startsWith('/auth/') || ['/bff/admin/sessions/refresh', '/bff/admin/sessions/revoke'].includes(path)) return Response.json({ message: 'Route indisponible.' }, {
    status: 404, headers: { 'Cache-Control': 'no-store' },
  });
  const headers = new Headers(request.headers);
  headers.delete('Authorization');
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
  const relay = new NextRequest(request.url, {
    method: request.method, headers, ...(body ? { body } : {}),
  });
  return proxyPublishedBffRequest(relay, path.split('/').filter(Boolean), {
    baseUrl: () => baseUrl,
    paths: contract.paths,
    loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',
    frontUrl: () => process.env.ADMINISTRATION_FRONT_URL?.trim() ?? '',
  });
}

export async function proxyBffRequest(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (path.some((part) => !part || part === '.' || part === '..' || part.includes('/'))) {
    return Response.json({ error: { message: 'Chemin invalide.' } }, { status: 400 });
  }
  return forwardToBff(request, configuredBffUrl(), `/${path.map(encodeURIComponent).join('/')}`);
}
