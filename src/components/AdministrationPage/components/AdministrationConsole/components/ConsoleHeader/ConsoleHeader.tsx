"use client";
import { PageHeader, RefreshButton } from "@mairie360/lib-components/primitives";

/** C9: the console title row with the global refresh (Figma PageHeader WithActions). */
export const ConsoleHeader = ({ loading, locked, onRefresh }: { loading: boolean; locked: boolean; onRefresh: () => void }) => (
  <PageHeader title="Administration" subtitle="Comptes des agents, rôles et groupes de la mairie"
    actions={<RefreshButton label="Actualiser" variant="outline" tone="neutral" loading={loading} disabled={locked} onClick={onRefresh} />} />
);
