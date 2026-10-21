"use client";
import { type FormEvent } from "react";
import { CancelButton, Checkbox, CreateButton, SaveButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from "@/components/administration-mutation-form";
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH, NO_MARKUP_HINT, NO_MARKUP_PATTERN, reportMarkupValidity } from "@/lib/text-constraints";
import { Field, inputClassName, textareaClassName } from "../shared/controls";

export type RoleWriteMode = "create" | "replace" | "update";
export interface RoleDraft { name: string; description: string; can_be_deleted?: boolean | null }

export const roleFormTitle = (mode: RoleWriteMode) => mode === "create" ? "Créer un rôle" : "Modifier le rôle";
export const roleFormDescription = (mode: RoleWriteMode) => mode === "create"
  ? "Ajoutez un nouveau rôle à l’organisation."
  : mode === "replace" ? "Remplacez les informations complètes du rôle." : "Mettez à jour les informations du rôle.";

/** Create / replace (PUT) / update (PATCH) a role. */
export const RoleForm = ({ mode, form, saving, onModeChange, onChange, onCancel, onSubmit }: {
  mode: RoleWriteMode; form: RoleDraft; saving: boolean;
  onModeChange: (mode: RoleWriteMode) => void; onChange: (form: RoleDraft) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => (
  <AdministrationMutationForm id="role-form" onSubmit={onSubmit} className="space-y-4">
    {mode !== "create" && (
      <Field label="Type de modification" htmlFor="role-write-mode">
        <select id="role-write-mode" className={inputClassName} value={mode} onChange={(event) => onModeChange(event.target.value as RoleWriteMode)}>
          <option value="replace">Remplacement complet (PUT)</option>
          <option value="update">Mise à jour partielle (PATCH)</option>
        </select>
      </Field>
    )}
    <Field label="Nom" htmlFor="role-name">
      <input id="role-name" required maxLength={NAME_MAX_LENGTH} pattern={NO_MARKUP_PATTERN} title={NO_MARKUP_HINT} className={inputClassName} value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} />
    </Field>
    <Field label="Description" htmlFor="role-description">
      <textarea id="role-description" required maxLength={DESCRIPTION_MAX_LENGTH} title={NO_MARKUP_HINT} className={textareaClassName} value={form.description} onChange={(event) => { reportMarkupValidity(event.target); onChange({ ...form, description: event.target.value }); }} />
    </Field>
    <Checkbox label="Autoriser la suppression de ce rôle" checked={form.can_be_deleted === true} onChange={(event) => onChange({ ...form, can_be_deleted: event.target.checked })} />
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      {mode !== "create" && <CancelButton variant="ghost" onClick={onCancel} />}
      {mode === "create" ? <CreateButton type="submit" label="Créer" loading={saving} /> : <SaveButton type="submit" label="Enregistrer" loading={saving} />}
    </div>
  </AdministrationMutationForm>
);
