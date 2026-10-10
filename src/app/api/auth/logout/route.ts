import { createSessionLogoutProxy } from '@mairie360/lib-components/next';

/** Delegate explicit logout to Login; the browser checks its revocation receipt. */
export const POST = createSessionLogoutProxy({
  loginUrl: () => process.env.LOGIN_FRONT_URL?.trim() ?? '',
  frontUrl: () => process.env.ADMINISTRATION_FRONT_URL?.trim() ?? '',
});
