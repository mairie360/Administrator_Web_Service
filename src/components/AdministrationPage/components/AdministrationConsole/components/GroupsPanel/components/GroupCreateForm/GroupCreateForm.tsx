"use client";
import { type FormEvent } from "react";
import { CreateButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, NO_MARKUP_HINT, NO_MARKUP_PATTERN } from '@/lib/text-constraints';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';

export interface GroupDraft { name: string; description: string }

/** Name + description of a new group. */
export const GroupCreateForm = ({ form, saving, onChange, onSubmit }: { form: GroupDraft; saving: boolean; onChange: (form: GroupDraft) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end">
    <Field label="Nom" htmlFor="group-name">
      <input id="group-name" required maxLength={NAME_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
    </Field>
    <Field label="Description" htmlFor="group-description">
      <input id="group-description" required maxLength={DESCRIPTION_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} />
    </Field>
    <CreateButton type="submit" label="Créer" loading={saving} />
  </AdministrationMutationForm>
);
