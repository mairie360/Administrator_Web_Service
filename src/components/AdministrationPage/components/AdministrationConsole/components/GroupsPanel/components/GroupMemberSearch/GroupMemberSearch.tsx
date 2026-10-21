"use client";
import { Plus, Search } from "lucide-react";
import { Caption, ErrorText, Icon, Skeleton } from "@mairie360/lib-components/primitives";

import type { AdministrationUser } from '@/lib/administration-api';
import { ActionButton } from '@/components/AdministrationPage/components/ActionButton';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';
import { memberIdentity } from '../MemberIdentity';

/** Search field and the users that can still join the group. */
export const GroupMemberSearch = ({ search, onSearch, candidates, loading, error, busyAction, onAdd }: {
  search: string; onSearch: (value: string) => void; candidates: AdministrationUser[]; loading: boolean; error: string | null; busyAction: string | null; onAdd: (user: AdministrationUser) => void;
}) => (
  <div className="border-t border-[var(--mairie-border)] pt-5">
    <Field label="Ajouter un utilisateur" htmlFor="group-user-search" hint="Recherchez par nom, prénom ou adresse e-mail.">
      <div className="relative">
        <Icon icon={Search} size="s" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mairie-muted)]" />
        <input id="group-user-search" type="search" className={inputClassName + " pl-9"} placeholder="Ex. Marie Martin" value={search} onChange={(event) => onSearch(event.target.value)} />
      </div>
    </Field>
    <div className="mt-3">
      {loading ? <Skeleton label="Recherche des utilisateurs…" shape="block" size="xs" />
        : error ? <ErrorText className="py-3">{error}</ErrorText>
        : candidates.length === 0 ? <Caption as="p" className="py-3">Aucun utilisateur disponible pour cette recherche.</Caption>
        : (
          <div className="max-h-60 divide-y divide-[var(--mairie-border)] overflow-y-auto rounded-lg border border-[var(--mairie-border)]">
            {candidates.map((user) => (
              <div key={user.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                {memberIdentity({ firstName: user.first_name, lastName: user.last_name, email: user.email })}
                <ActionButton variant="secondary" size="s" className="shrink-0" icon={Plus} busy={busyAction === "add-group-user-" + user.id} onClick={() => onAdd(user)}>Ajouter</ActionButton>
              </div>
            ))}
          </div>
        )}
    </div>
  </div>
);
