"use client";
import { type FormEvent } from "react";
import { Caption, SaveButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, NO_MARKUP_HINT, NO_MARKUP_PATTERN, reportMarkupValidity } from '@/lib/text-constraints';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName, textareaClassName } from '@/components/AdministrationPage/controls';
import type { GroupDraft } from '../GroupCreateForm';

/** Name, description and owner of the selected group. */
export const GroupEditForm = ({ form, ownerLabel, saving, onChange, onSubmit }: { form: GroupDraft; ownerLabel: string; saving: boolean; onChange: (form: GroupDraft) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="space-y-4">
    <Field label="Nom du groupe" htmlFor="edit-group-name">
      <input id="edit-group-name" required maxLength={NAME_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
    </Field>
    <Field label="Description" htmlFor="edit-group-description">
      <textarea id="edit-group-description" maxLength={DESCRIPTION_MAX_LENGTH} title={NO_MARKUP_HINT} className={textareaClassName} value={form.description} onChange={(event) => { reportMarkupValidity(event.target); onChange({ ...form, description: event.target.value }); }} />
    </Field>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Caption>Propriétaire : {ownerLabel}</Caption>
      <SaveButton type="submit" label="Enregistrer le groupe" loading={saving} />
    </div>
  </AdministrationMutationForm>
);
