"use client";
import { Help } from "@mairie360/lib-components/primitives";

import { navigateToLogin } from '@/lib/logout';
import { ActionButton } from '../ActionButton';

/** The logout could not be confirmed: explicit return to Login. */
export const LogoutFailure = ({ message }: { message: string }) => (
  <section role="alert" className="mb-4 space-y-2 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <Help>{message}</Help>
    <ActionButton variant="secondary" onClick={() => navigateToLogin({ explicit: true })}>Retour à la connexion</ActionButton>
  </section>
);
