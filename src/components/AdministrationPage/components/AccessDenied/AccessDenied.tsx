"use client";
import { Help, PageTitle } from "@mairie360/lib-components/primitives";

/** A signed-in non-administrator. */
export const AccessDenied = () => (
  <section className="space-y-2 rounded-lg border border-[var(--mairie-border)] bg-[var(--mairie-surface)] p-6">
    <PageTitle size="l">Accès réservé aux administrateurs</PageTitle>
    <Help>Votre profil ne permet pas d’ouvrir la console d’administration.</Help>
  </section>
);
