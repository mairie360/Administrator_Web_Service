"use client";
import { type FormEvent } from "react";
import { CreateButton, FilterSelect, SearchField } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import type { AccountStatus, AdministrationRole } from '@/lib/administration-api';
import { accountStatusOptions } from '../../users-model';

export interface UsersToolbarProps {
  searchInput: string;
  status: AccountStatus | "";
  roleId: number | null;
  roles: AdministrationRole[];
  locked: boolean;
  onType: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStatus: (status: AccountStatus | "") => void;
  onRole: (roleId: number | null) => void;
  onCreate: () => void;
}

/** F01–F03: search on the name or the e-mail, state and role filters (single-choice menus), « Nouvel utilisateur ». */
export const UsersToolbar = ({ searchInput, status, roleId, roles, locked, onType, onSubmit, onStatus, onRole, onCreate }: UsersToolbarProps) => (
  <div className="flex flex-wrap items-end gap-3">
    {/* Like the mutation forms, the search has no HTML endpoint: read-only until the page is hydrated. */}
    <AdministrationMutationForm role="search" aria-label="Rechercher un utilisateur" onSubmit={onSubmit} className="min-w-0 flex-[1_1_280px]">
      <SearchField id="users-search" label="Rechercher" placeholder="Nom ou e-mail" maxLength={100} value={searchInput}
        onChange={(event) => onType(event.target.value)} />
    </AdministrationMutationForm>
    <FilterSelect<AccountStatus> mode="menu" label="Statut" allLabel="Tous les statuts" options={accountStatusOptions} value={status}
      disabled={locked} onChange={onStatus} />
    <FilterSelect<string> mode="menu" label="Rôle" allLabel="Tous les rôles" options={roles.map((role) => ({ value: String(role.id), label: role.name }))}
      value={roleId ? String(roleId) : ""} disabled={locked} onChange={(value) => onRole(value ? Number(value) : null)} />
    <CreateButton label="Nouvel utilisateur" className="sm:ml-auto" disabled={locked} onClick={onCreate} />
  </div>
);
