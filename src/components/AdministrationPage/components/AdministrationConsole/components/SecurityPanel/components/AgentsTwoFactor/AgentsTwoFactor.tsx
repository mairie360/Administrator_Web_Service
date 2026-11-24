"use client";
import { RotateCcw } from "lucide-react";
import { DataTable, IconButton, Pagination, Panel, StatusPill, UserIdentity, formatDateTime, type DataTableColumn } from "@mairie360/lib-components/primitives";

import type { AdministrationUser, AdministrationUsersPage } from '@/lib/administration-api';

const methodLabels = { passkey: "Passkey", totp: "Application", backup_codes: "Codes de secours" } as const;

/** A2: the methods an agent enrolled, « Aucune » without second factor. */
export const twoFactorMethods = (user: Pick<AdministrationUser, "two_factor">) =>
  user.two_factor.methods.map((method) => methodLabels[method]).join(" · ") || "Aucune";

export interface AgentsTwoFactorProps {
  page: AdministrationUsersPage | null;
  state: "loading" | "default" | "error";
  locked: boolean;
  onPage: (page: number) => void;
  onRetry: () => void;
  onReset: (user: AdministrationUser) => void;
}

/** A2: the agents with their second-factor method and last verification, and « Réinitialiser » (lost phone). */
export function AgentsTwoFactor({ page, state, locked, onPage, onRetry, onReset }: AgentsTwoFactorProps) {
  const columns: DataTableColumn<AdministrationUser>[] = [
    { key: "name", header: "Agent", kind: "content", cell: (user) => <UserIdentity name={`${user.first_name} ${user.last_name}`} email={user.email} size="s" /> },
    {
      key: "method", header: "Méthode", kind: "content",
      cell: (user) => user.two_factor.methods.length > 0
        ? <StatusPill label={twoFactorMethods(user)} tone="success" size="s" />
        : <StatusPill label="Aucune" tone="neutral" size="s" />,
    },
    { key: "verified", header: "Dernière vérification", cell: (user) => (user.two_factor.last_verified_at ? formatDateTime(user.two_factor.last_verified_at, "medium") : null) ?? "Jamais" },
    {
      key: "actions", header: "Actions", hideHeader: true, kind: "actions",
      cell: (user) => user.two_factor.methods.length > 0
        ? <IconButton size="s" icon={RotateCcw} label={`Réinitialiser la double authentification de ${user.first_name} ${user.last_name}`} disabled={locked} onClick={() => onReset(user)} />
        : null,
    },
  ];
  const rows = page?.users ?? [];
  const tableState = state === "loading" ? "loading" : state === "error" ? "error" : rows.length === 0 ? "empty" : "default";
  return (
    <Panel className="administration-panel" title="Double authentification des agents" description="Méthode configurée et dernière vérification de chaque agent." flush>
      <DataTable<AdministrationUser> label="Double authentification des agents" columns={columns} rows={rows} rowKey={(user) => String(user.id)} state={tableState} skeletonRows={6}
        stateProps={tableState === "error" ? { title: "Les agents n’ont pas pu être chargés.", onRetry } : { title: "Aucun agent" }} />
      {page && page.total > 0 && (
        <Pagination className="border-t border-[var(--mairie-border)] px-4 py-2.5" page={page.page} pageSize={page.page_size} total={page.total}
          loading={state === "loading" || locked} itemsLabel="agents" label="Pagination des agents" onChange={onPage} />
      )}
    </Panel>
  );
}
