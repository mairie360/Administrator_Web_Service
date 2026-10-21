"use client";

import { useRef, useState } from "react";
import { AccessibleShell } from "@mairie360/lib-components/shell";

import type { InitialAdministration } from '../../lib/administration-response';
import { logoutAndReload, useAuthSession } from '../../lib/auth-session';
import { getActiveFrontHrefs } from '../../lib/navigation';
import { AdministrationConsole } from './components/AdministrationConsole';
import { AccessDenied } from './components/AccessDenied';
import { LogoutFailure } from './components/LogoutFailure';
import { ProfileChecking } from './components/ProfileChecking';
import { ProfileUnavailable } from './components/ProfileUnavailable';

/** The administration page: shell, then the profile check, the console or the access refusal. */
export default function AdministrationPage({ initialState, initialSearch }: { initialState?: InitialAdministration; initialSearch?: string }) {
  const [initial] = useState(initialState);
  const session = useAuthSession(undefined, initial?.session);
  const hrefs = getActiveFrontHrefs();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logoutAndReload(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };
  return (
    <AccessibleShell className="administration-shell" activeItem="admin" user={session.user} onLogout={() => void requestLogout()} hrefs={hrefs}>
      <div className="min-w-0 w-full">
        {logoutError && <LogoutFailure message={logoutError} />}
        {session.loading ? <ProfileChecking />
          : session.error ? <ProfileUnavailable error={session.error} onRetry={session.retry} />
          : session.isAdmin ? <AdministrationConsole initialState={initial?.console ?? undefined} initialSearch={initialSearch} />
          : <AccessDenied />}
      </div>
    </AccessibleShell>
  );
}
