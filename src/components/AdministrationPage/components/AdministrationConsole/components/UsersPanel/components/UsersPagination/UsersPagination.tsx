"use client";
import { Caption, IconButton, Text } from "@mairie360/lib-components/primitives";

import type { AdministrationUsersPage } from '@/lib/administration-api';

/** Count, « 20 maximum par page » and previous / next, with the honest states after a write or a failed read. */
export const UsersPagination = ({ usersPage, page, loading, received, mutationConfirmed, onChange }: { usersPage: AdministrationUsersPage; page: number; loading: boolean; received: boolean; mutationConfirmed: boolean; onChange: (direction: number) => void }) => (
  <div className="flex flex-col gap-3 border-t border-[var(--mairie-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
    <Caption tone="muted">
      {mutationConfirmed ? "Total à actualiser"
        : received ? `${usersPage.total} utilisateur${usersPage.total > 1 ? "s" : ""}`
        : loading ? "Nombre d’utilisateurs en cours de chargement" : "Nombre d’utilisateurs indisponible"} · 20 maximum par page
    </Caption>
    <div className="flex items-center gap-2">
      <IconButton preset="previous" label="Page précédente" size="s" disabled={page <= 1 || loading} onClick={() => onChange(-1)} />
      <Text size="s" weight="semibold" className="min-w-24 text-center">
        {received || mutationConfirmed
          ? <>Page {usersPage.page}{mutationConfirmed ? " · pagination à actualiser" : ` / ${Math.max(usersPage.total_pages, 1)}`}</>
          : loading ? "Pagination en cours de chargement" : "Pagination indisponible"}
      </Text>
      <IconButton preset="next" label="Page suivante" size="s" disabled={loading || usersPage.total_pages === 0 || page >= usersPage.total_pages} onClick={() => onChange(1)} />
    </div>
  </div>
);
