"use client";
import { DataTable, DeleteIconButton, EditIconButton, StatusPill, type DataTableColumn } from "@mairie360/lib-components/primitives";

import { MODULE_LABELS, type AdministrationRole, type RoleModule } from '@/lib/administration-api';

export interface RolesTableProps {
  roles: AdministrationRole[] | null;
  loading: boolean;
  locked: boolean;
  /** The role whose modal is open stays selected (F15). */
  selectedId: number | null;
  onOpen: (role: AdministrationRole) => void;
  onDelete: (role: AdministrationRole) => void;
  onRetry: () => void;
}

/** F15: the roles on the lib DataTable; the row, its name or its pencil opens the role modal, « Supprimer » keeps its own click. */
export function RolesTable({ roles, loading, locked, selectedId, onOpen, onDelete, onRetry }: RolesTableProps) {
  const columns: DataTableColumn<AdministrationRole>[] = [
    { key: "name", header: "Rôle", kind: "strong", cell: (role) => role.name },
    { key: "description", header: "Description", cell: (role) => role.description || "Sans description" },
    {
      key: "modules", header: "Modules accessibles",
      cell: (role) => role.modules?.length ? role.modules.map((module) => MODULE_LABELS[module as RoleModule] ?? module).join(", ") : "Aucun module",
    },
    {
      key: "kind", header: "Type", kind: "content",
      cell: (role) => role.can_be_deleted === false ? <StatusPill label="Rôle système" tone="info" size="s" /> : <StatusPill label="Personnalisé" tone="neutral" size="s" />,
    },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (role) => (
        <span className="inline-flex gap-1">
          <EditIconButton size="s" label={`Modifier le rôle ${role.name}`} disabled={locked} onClick={() => onOpen(role)} />
          <DeleteIconButton size="s" label={`Supprimer ${role.name}`} disabled={locked} onClick={() => onDelete(role)} />
        </span>
      ),
    },
  ];
  const state = roles === null ? (loading ? "loading" : "error") : roles.length === 0 ? "empty" : "default";
  return (
    <DataTable<AdministrationRole> label="Rôles" columns={columns} rows={roles ?? []} rowKey={(role) => String(role.id)} state={state} skeletonRows={4}
      onRowClick={locked ? undefined : onOpen} rowLabel={(role) => `Modifier le rôle ${role.name}`}
      rowProps={(role) => ({ "aria-selected": role.id === selectedId, "data-role-id": role.id } as React.HTMLAttributes<HTMLTableRowElement>)}
      stateProps={state === "error" ? { title: "Les rôles n’ont pas pu être chargés.", onRetry } : { title: "Aucun rôle disponible." }} />
  );
}
