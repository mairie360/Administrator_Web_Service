"use client";
import { CheckCircle2, Lock } from "lucide-react";
import { DataTable, DeleteIconButton, EditIconButton, IconButton, StatusPill, Tag, UserIdentity, type DataTableColumn } from "@mairie360/lib-components/primitives";

import type { AdministrationUser, UsersSort } from '@/lib/administration-api';
import { accountStatuses, fullName, lastLoginLabel, onlineLabel, roleName } from '../../users-model';

export interface UsersTableProps {
  users: AdministrationUser[];
  state: "default" | "loading" | "empty" | "error";
  sort: UsersSort;
  /** Id of the signed-in administrator: their own row offers neither suspension nor deletion. */
  currentUserId: number | null;
  locked: boolean;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  errorTitle?: string;
  onRetry?: () => void;
  onSort: (sort: UsersSort) => void;
  onOpen: (user: AdministrationUser) => void;
  onEdit: (user: AdministrationUser) => void;
  onToggleSuspension: (user: AdministrationUser) => void;
  onDelete: (user: AdministrationUser) => void;
}

/**
 * C3 / F04 / F10: the users list on the lib DataTable. The whole row (and the name) opens the user record,
 * the action buttons keep their own click; « Dernière connexion » shows « En ligne · N sessions » (C6).
 */
export function UsersTable({ users, state, sort, currentUserId, locked, emptyTitle, emptyDescription, emptyAction, errorTitle, onRetry, onSort, onOpen, onEdit, onToggleSuspension, onDelete }: UsersTableProps) {
  const columns: DataTableColumn<AdministrationUser>[] = [
    { key: "name", header: "Utilisateur", sortable: true, kind: "content", cell: (user) => <UserIdentity name={fullName(user)} email={user.email} size="s" /> },
    { key: "role", header: "Rôle", kind: "content", cell: (user) => <Tag label={roleName(user)} size="s" /> },
    {
      key: "status", header: "Statut", kind: "content",
      cell: (user) => <StatusPill data-status={user.account_status} label={accountStatuses[user.account_status].label} tone={accountStatuses[user.account_status].tone} dot size="s" />,
    },
    {
      key: "last_login", header: "Dernière connexion", kind: "content",
      cell: (user) => user.active_sessions > 0
        ? <StatusPill label={onlineLabel(user.active_sessions)} tone="success" dot size="s" />
        : <span className="text-sm text-[var(--mairie-muted)]">{lastLoginLabel(user)}</span>,
    },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (user) => {
        const own = user.id === currentUserId;
        const suspended = user.account_status === "suspended";
        return (
          <span className="inline-flex gap-1">
            <EditIconButton size="s" label={`Modifier ${fullName(user)}`} disabled={locked} onClick={() => onEdit(user)} />
            {!own && user.account_status !== "inactive" && (
              <IconButton size="s" icon={suspended ? CheckCircle2 : Lock} label={`${suspended ? "Réactiver" : "Suspendre"} ${fullName(user)}`} disabled={locked} onClick={() => onToggleSuspension(user)} />
            )}
            {!own && user.account_status !== "inactive" && <DeleteIconButton size="s" label={`Supprimer ${fullName(user)}`} disabled={locked} onClick={() => onDelete(user)} />}
          </span>
        );
      },
    },
  ];
  return (
    <DataTable<AdministrationUser> label="Utilisateurs" columns={columns} rows={users} rowKey={(user) => String(user.id)} state={state}
      sort={{ key: "name", direction: sort === "-name" ? "desc" : "asc" }}
      onSort={(_key, direction) => onSort(direction === "desc" ? "-name" : "name")}
      onRowClick={locked ? undefined : onOpen} rowLabel={(user) => `Ouvrir la fiche de ${fullName(user)}`}
      rowProps={(user) => ({ "data-status": user.account_status } as React.HTMLAttributes<HTMLTableRowElement>)}
      skeletonRows={6}
      stateProps={state === "error" ? { title: errorTitle ?? "Les utilisateurs n’ont pas pu être chargés.", onRetry } : { title: emptyTitle, description: emptyDescription, action: emptyAction }} />
  );
}
