import { frontUrl } from './front-urls';
import { parseFrontUrl } from './front-url';
import { clearStoredAuthJwtToken } from './auth-token';

const navigatingLocations = new WeakSet<Location>();
const recoveryLocations = new WeakSet<Location>();

export function isSessionRecoveryPending() {
  return typeof window !== 'undefined' && recoveryLocations.has(window.location);
}

/** A persistent data refusal returns to Login without revoking Login-owned cookies. */
export function navigateToLogin(options: { explicit?: boolean } = {}) {
  if (typeof window === 'undefined') return false;
  const location = window.location;
  if (!options.explicit && (navigatingLocations.has(location) || recoveryLocations.has(location))) return false;
  const destination = parseFrontUrl(frontUrl('LOGIN_FRONT_URL'));
  if (!destination) return false;
  const publicFront = parseFrontUrl(frontUrl('ADMINISTRATION_FRONT_URL'));
  if (publicFront && publicFront.origin === location.origin) {
    publicFront.pathname = location.pathname;
    publicFront.search = location.search;
    destination.searchParams.set('redirect', publicFront.href);
  }
  navigatingLocations.add(location);
  try {
    clearStoredAuthJwtToken();
    location.assign(destination.href);
    if (options.explicit) recoveryLocations.delete(location);
    return true;
  } catch {
    navigatingLocations.delete(location);
    return false;
  }
}

/** Only a confirmed Login owner receipt permits automatic navigation. */
export async function logoutAndReload() {
  const location = typeof window === 'undefined' ? undefined : window.location;
  if (location) recoveryLocations.add(location);
  let confirmed = false;
  let singleSignOut: URL | undefined;
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST', cache: 'no-store', credentials: 'same-origin', redirect: 'manual',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: '{}',
    });
    const body: unknown = await response.json();
    confirmed = response.status === 200 && typeof body === 'object' && body !== null &&
      'session_revoked' in body && body.session_revoked === true &&
      'message' in body && typeof body.message === 'string' && body.message.trim().length > 0;
    if (!confirmed) throw new Error('Unconfirmed logout receipt');
    if (typeof body === 'object' && body !== null && 'logout_url' in body) {
      singleSignOut = parseFrontUrl(typeof body.logout_url === 'string' ? body.logout_url : undefined);
      if (!singleSignOut || singleSignOut.protocol !== 'https:' || singleSignOut.hash ||
        !/^\/realms\/[^/]+\/protocol\/openid-connect\/logout$/.test(singleSignOut.pathname)) {
        throw new Error('Invalid single sign-out destination');
      }
    }
  } catch {
    if (location) recoveryLocations.add(location);
    throw new Error('La déconnexion n’a pas été confirmée. Votre session reste à vérifier.');
  }
  clearStoredAuthJwtToken();
  if (singleSignOut && location) {
    location.assign(singleSignOut.href);
    recoveryLocations.delete(location);
    return;
  }
  if (!navigateToLogin({ explicit: true })) {
    if (location) recoveryLocations.add(location);
    throw new Error('La déconnexion est confirmée, mais le retour à la connexion est indisponible.');
  }
}
