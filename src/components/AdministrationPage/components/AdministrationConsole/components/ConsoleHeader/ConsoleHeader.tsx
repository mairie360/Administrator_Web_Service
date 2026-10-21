"use client";
import { PageHeader, RefreshButton } from "@mairie360/lib-components/primitives";

/** The console title row with the global refresh (Figma PageHeader WithActions). */
export const ConsoleHeader = ({ loading, locked, onRefresh }: { loading: boolean; locked: boolean; onRefresh: () => void }) => (
  <PageHeader title="Administration" subtitle="Gérez les comptes, les rôles et les équipes de votre mairie."
    actions={<RefreshButton label="Actualiser" variant="outline" tone="neutral" loading={loading} disabled={locked} onClick={onRefresh} />} />
);
