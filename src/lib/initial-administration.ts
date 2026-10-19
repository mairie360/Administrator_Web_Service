import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { isExpiredJwt, publicOrigin } from '@mairie360/lib-components/shared';
import { BffRequestError, createUserClient, type requestBff } from './bff-client';
import { configuredBffUrl, forwardToBff } from './bff-proxy';
import { parseAuthSession, type AuthSession } from './auth-session-model';
import { createAdministrationApi } from './administration-api';
import { administrationErrorMessage } from './administration-error';
import { readPageUrlState } from './page-url-state';
import { usersUrlSchema } from './administration-query';
import type { InitialAdministration } from './administration-response';

function unavailable(error: string): InitialAdministration {
  const session: AuthSession = { user: { name: '', role: 'Guest' }, groups: [], roles: ['Guest'], role: 'Guest', isAdmin: false, loading: false, error };
  return { session, console: null };
}
/** Access-cookie-only render reads use the existing contract-gated proxy. No render writes cookies. */
export async function readInitialAdministration(search: string): Promise<InitialAdministration> {
  const origin = publicOrigin(process.env.ADMINISTRATION_FRONT_URL);
  if (!origin) return unavailable('Le service d’administration est temporairement indisponible. Réessayez.');
  const access = (await cookies()).get('accessToken')?.value;
  if (isExpiredJwt(access)) return unavailable('Votre session doit être renouvelée. Réessayez depuis cette page.');
  const request: typeof requestBff = async <T>(path: string, init: RequestInit = {}) => {
    const target = new URL(path, origin);
    if (target.origin !== origin || (init.method ?? 'GET') !== 'GET') throw new BffRequestError(503);
    const response = await forwardToBff(new NextRequest(target, { method: 'GET', headers: { Accept: 'application/json', Cookie: `accessToken=${encodeURIComponent(access!)}` } }), configuredBffUrl(), target.pathname);
    if (!response.ok) throw new BffRequestError(response.status);
    return await response.json() as T;
  };
  const client = createUserClient(request);
  let session: AuthSession;
  try { session = parseAuthSession((await client.getMe()).data); }
  catch (error) { return unavailable(error instanceof BffRequestError && error.status === 401 ? 'Votre session doit être renouvelée. Réessayez depuis cette page.' : 'Les informations du profil sont indisponibles. Réessayez.'); }
  if (!session.isAdmin) return { session, console: null };
  const api = createAdministrationApi(client);
  const query = readPageUrlState(search, usersUrlSchema);
  const [users, roles, groups, active, history] = await Promise.allSettled([
    api.listUsers({ page: Number(query.usersPage), search: query.usersSearch }), api.listRoles(), api.listGroups(), api.listActiveSessions(), api.listSessionHistory(),
  ]);
  const failures = [roles, groups, active, history].filter((result): result is PromiseRejectedResult => result.status === 'rejected');
  return { session, console: {
    users: users.status === 'fulfilled' ? users.value : null,
    roles: roles.status === 'fulfilled' ? roles.value : null,
    groups: groups.status === 'fulfilled' ? groups.value : null,
    activeSessions: active.status === 'fulfilled' ? active.value : null,
    sessionHistory: history.status === 'fulfilled' ? history.value : null,
    usersError: users.status === 'rejected' ? administrationErrorMessage(users.reason) : null,
    error: failures.length ? [...new Set(failures.map(result => administrationErrorMessage(result.reason)))].join(' ') : null,
    authRequired: [...failures, ...(users.status === 'rejected' ? [users] : [])].some(result => result.reason instanceof BffRequestError && result.reason.status === 401),
  } };
}
