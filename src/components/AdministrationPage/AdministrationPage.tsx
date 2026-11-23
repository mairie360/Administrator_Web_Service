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
export default function AdministrationPage({ initialState, initialSearch, commune }: { initialState?: InitialAdministration; initialSearch?: string; commune?: string }) {
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
    // C7 / C8 (lib 2.3, MAIR-1109): the commune of the deployment in the header and the navigation; hidden when unknown.
    <AccessibleShell className="administration-shell" activeItem="admin" user={session.user} onLogout={() => void requestLogout()} hrefs={hrefs}
      headerProps={{ commune, showCommune: Boolean(commune) }} sidebarProps={commune ? { brandLabel: commune } : undefined}>
      <div className="min-w-0 w-full">
        {logoutError && <LogoutFailure message={logoutError} />}
        {session.loading ? <ProfileChecking />
          : session.error ? <ProfileUnavailable error={session.error} onRetry={session.retry} />
          : session.isAdmin ? <AdministrationConsole initialState={initial?.console ?? undefined} initialSearch={initialSearch} currentUserId={session.user?.id ?? null} />
          : <AccessDenied />}
      </div>
    </AccessibleShell>
  );
}
