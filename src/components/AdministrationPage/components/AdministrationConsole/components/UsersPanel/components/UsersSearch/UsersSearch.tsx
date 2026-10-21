"use client";
import { type FormEvent } from "react";
import { Search } from "lucide-react";
import { Icon } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import { ActionButton } from '@/components/AdministrationPage/components/ActionButton';
import { inputClassName } from '@/components/AdministrationPage/controls';

/** The users search: typing searches after 250 ms, the button searches now. */
export const UsersSearch = ({ value, onType, onSubmit }: { value: string; onType: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center" role="search">
    <label className="relative block flex-1">
      <span className="sr-only">Rechercher un utilisateur</span>
      <Icon icon={Search} size="s" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--mairie-muted)]" />
      <input type="search" maxLength={100} className={inputClassName + " pl-9"} placeholder="Rechercher par nom, prénom ou e-mail" value={value} onChange={(event) => onType(event.target.value)} />
    </label>
    <ActionButton type="submit" variant="secondary">Rechercher</ActionButton>
  </AdministrationMutationForm>
);
