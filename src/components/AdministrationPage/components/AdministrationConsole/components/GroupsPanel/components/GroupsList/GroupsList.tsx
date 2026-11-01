"use client";
import { DataState } from "@mairie360/lib-components/primitives";

import type { AdministrationGroup } from '@/lib/administration-api';
import { GroupCard } from './components/GroupCard';

/** The groups grid or its loading / unavailable / empty state. */
export const GroupsList = ({ groups, loading, selectedId, onOpen }: { groups: AdministrationGroup[] | null; loading: boolean; selectedId: number | null; onOpen: (groupId: number) => void }) => {
  if (groups === null) return loading
    ? <DataState state="loading" size="s" title="Chargement des groupes…" />
    : <DataState state="unavailable" size="s" role="status" title="Les groupes n’ont pas pu être chargés. Utilisez Actualiser pour réessayer." description={null} />;
  if (groups.length === 0) return <DataState state="empty" size="s" title="Aucun groupe pour le moment." description={null} />;
  return <div className="grid gap-3 sm:grid-cols-2">{groups.map((group) => <GroupCard key={group.id} group={group} selected={selectedId === group.id} onOpen={onOpen} />)}</div>;
};
