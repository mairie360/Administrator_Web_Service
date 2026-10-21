"use client";
import { Help, PageTitle, RetryButton, Skeleton } from "@mairie360/lib-components/primitives";

import { navigateToLogin } from "@/lib/logout";
import { ActionButton } from "../shared/controls";

/** The administrator profile is being checked. */
export const ProfileChecking = () => (<><h1 className="sr-only">Administration</h1><Skeleton.Card label="Vérification du profil…" /></>);

/** The profile read failed: message and explicit retry. */
export const ProfileUnavailable = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <section className="space-y-4 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <div role="alert" className="space-y-2"><PageTitle size="l">Profil indisponible</PageTitle><Help>{error}</Help></div>
    <RetryButton variant="outline" tone="neutral" onClick={onRetry} />
  </section>
);

/** A signed-in non-administrator. */
export const AccessDenied = () => (
  <section className="space-y-2 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <PageTitle size="l">Accès réservé aux administrateurs</PageTitle>
    <Help>Votre profil ne permet pas d’ouvrir la console d’administration.</Help>
  </section>
);

/** The logout could not be confirmed: explicit return to Login. */
export const LogoutFailure = ({ message }: { message: string }) => (
  <section role="alert" className="mb-4 space-y-2 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <Help>{message}</Help>
    <ActionButton variant="secondary" onClick={() => navigateToLogin({ explicit: true })}>Retour à la connexion</ActionButton>
  </section>
);
