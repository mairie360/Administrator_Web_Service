"use client";
import { EMPTY_SESSION_USER, parseAuthSession, type AuthSession, type AuthSessionUser } from "./auth-session-model";
export * from "./auth-session-model";

import { useEffect, useState } from "react";
import { isSessionRecoveryPending, navigateToLogin } from "./logout";
export { logoutAndReload } from "./logout";

export function useAuthSession(initialUser: AuthSessionUser = EMPTY_SESSION_USER, initialSession?: AuthSession) {
  const [session, setSession] = useState<AuthSession>(initialSession ?? {
    user: {
      ...initialUser,
      name: "Chargement…",
      email: undefined,
      phone: undefined,
      service: undefined,
      status: undefined,
      position: undefined,
      address: undefined,
      city: undefined,
      lastConnection: undefined,
      role: "Guest",
    },
    groups: [],
    roles: ["Guest"],
    role: "Guest",
    isAdmin: false,
    loading: true,
    error: null,
  });

  const [retryRevision, setRetryRevision] = useState(0);
  useEffect(() => {
    if (initialSession && retryRevision === 0) return;
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/user/me", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (response.status === 401) {
          if (isSessionRecoveryPending()) return;
          if (!navigateToLogin()) setSession(current => ({
            ...current, loading: false, error: "La connexion est temporairement indisponible.",
          }));
          return;
        }

        if (!response.ok) {
          setSession((current) => ({
            ...current,
            loading: false,
            error: "Les informations du profil sont indisponibles.",
          }));
          return;
        }

        const receipt = await response.json();
        controller.signal.throwIfAborted();
        setSession(parseAuthSession(receipt));
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSession((current) => ({
          ...current,
          loading: false,
          error: "Le service utilisateur est indisponible.",
        }));
      }
    }

    void loadSession();

    return () => controller.abort();
  }, [initialUser, initialSession, retryRevision]);

  return { ...session, retry: () => setRetryRevision(value => value + 1) };
}
