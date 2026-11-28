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
import { useHeaderSearch } from './use-header-search';

/** The administration page: shell, then the profile check, the console or the access refusal. */
export default function AdministrationPage({ initialState, initialSearch, commune }: { initialState?: InitialAdministration; initialSearch?: string; commune?: string }) {
  const [initial] = useState(initialState);
  const session = useAuthSession(undefined, initial?.session);
  const hrefs = getActiveFrontHrefs(session.loading ? undefined : session.modules);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const logoutPending = useRef(false);
  const headerSearch = useHeaderSearch(initialSearch);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try { await logoutAndReload(); }
    catch (error) { setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier."); }
    finally { logoutPending.current = false; }
  };
  return (
    // The shared header of every front: the commune of the deployment feeds the header and the navigation (none when unknown).
    // The module area of the collapsible shell has no padding: the page gives the mockup's 24 px.
    // The header search finds agents (the mockup's « Rechercher un agent… »), only once the console is open.
    <AccessibleShell className="administration-shell" activeItem="admin" user={session.user} onLogout={() => void requestLogout()} hrefs={hrefs} commune={commune}
      headerProps={session.isAdmin ? { searchLabel: "Rechercher un agent", searchPlaceholder: "Rechercher un agent…", searchValue: headerSearch.value, onSearchChange: headerSearch.onChange, onSearch: headerSearch.onSearch } : undefined}>
      <div className="min-w-0 w-full p-6">
        {logoutError && <LogoutFailure message={logoutError} />}
        {session.loading ? <ProfileChecking />
          : session.error ? <ProfileUnavailable error={session.error} onRetry={session.retry} />
          : session.isAdmin ? <AdministrationConsole initialState={initial?.console ?? undefined} initialSearch={initialSearch} currentUserId={session.user?.id ?? null} />
          : <AccessDenied />}
      </div>
    </AccessibleShell>
  );
}
