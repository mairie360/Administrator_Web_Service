"use client";

import { AppShell } from "@mairie360/lib-components";
import { useRef, useState } from "react";
import { AdministrationConsole } from "@/components/administration-console";
import { logoutAndReload, useAuthSession } from "@/lib/auth-session";
import { getActiveFrontHrefs } from "@/lib/navigation";
import { navigateToLogin } from "@/lib/logout";

export default function Home() {
  const session = useAuthSession();
  const hrefs = getActiveFrontHrefs();
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const logoutPending = useRef(false);
  const requestLogout = async () => {
    if (logoutPending.current) return;
    logoutPending.current = true;
    try {
      await logoutAndReload();
    } catch (error) {
      setLogoutError(error instanceof Error ? error.message : "La déconnexion reste à vérifier.");
    } finally {
      logoutPending.current = false;
    }
  };

  return (
    <AppShell
      activeItem="admin"
      isAdmin={session.isAdmin}
      user={session.user}
      onLogout={() => void requestLogout()}
      hrefs={hrefs}
    >
      <div className="min-w-0 w-full">
        {logoutError && (
          <section role="alert" className="mb-4 space-y-2 rounded-lg border bg-card p-6">
            <p className="text-sm text-muted-foreground">{logoutError}</p>
            <button type="button" onClick={() => navigateToLogin({ explicit: true })}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
              Retour à la connexion
            </button>
          </section>
        )}
        {session.loading ? (
          <p role="status" className="text-sm text-muted-foreground">
            Vérification du profil…
          </p>
        ) : session.error ? (
          <section className="space-y-4 rounded-lg border bg-card p-6">
            <div role="alert" className="space-y-2">
              <h1 className="text-2xl font-semibold">Profil indisponible</h1>
              <p className="text-sm text-muted-foreground">{session.error}</p>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Réessayer
            </button>
          </section>
        ) : session.isAdmin ? (
          <AdministrationConsole />
        ) : (
          <section className="space-y-2 rounded-lg border bg-card p-6">
            <h1 className="text-2xl font-semibold">
              Accès réservé aux administrateurs
            </h1>
            <p className="text-sm text-muted-foreground">
              Votre profil ne permet pas d’ouvrir la console d’administration.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}
