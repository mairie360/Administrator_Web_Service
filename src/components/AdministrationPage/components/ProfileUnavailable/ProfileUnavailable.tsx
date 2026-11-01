"use client";
import { Help, PageTitle, RetryButton } from "@mairie360/lib-components/primitives";

/** The profile read failed: message and explicit retry. */
export const ProfileUnavailable = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <section className="space-y-4 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <div role="alert" className="space-y-2"><PageTitle size="l">Profil indisponible</PageTitle><Help>{error}</Help></div>
    <RetryButton variant="outline" tone="neutral" onClick={onRetry} />
  </section>
);
