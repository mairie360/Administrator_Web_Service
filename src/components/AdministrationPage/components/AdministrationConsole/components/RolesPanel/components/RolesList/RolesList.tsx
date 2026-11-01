"use client";
import { DataState } from "@mairie360/lib-components/primitives";

import type { AdministrationRole } from '@/lib/administration-api';
import { RoleRow } from './components/RoleRow';

/** The roles list or its loading / unavailable / empty state. */
export const RolesList = ({ roles, loading, busyAction, onEdit, onDelete }: { roles: AdministrationRole[] | null; loading: boolean; busyAction: string | null; onEdit: (role: AdministrationRole) => void; onDelete: (role: AdministrationRole) => void }) => {
  if (roles === null) return loading
    ? <DataState state="loading" size="s" title="Chargement des rôles…" />
    : <DataState state="unavailable" size="s" role="status" title="Les rôles n’ont pas pu être chargés. Utilisez Actualiser pour réessayer." description={null} />;
  if (roles.length === 0) return <DataState state="empty" size="s" title="Aucun rôle disponible." description={null} />;
  return (
    <div className="divide-y divide-[var(--mairie-border)] rounded-lg border border-[var(--mairie-border)]">
      {roles.map((role) => <RoleRow key={role.id} role={role} deleting={busyAction === `delete-role-${role.id}`} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  );
};
