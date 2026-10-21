"use client";
import { type FormEvent } from "react";
import { DeleteButton, SaveButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from "@/components/administration-mutation-form";
import type { AdministrationRole } from "@/lib/administration-api";
import { Field, inputClassName } from "../shared/controls";
import { UserFields, type UserIdentityDraft } from "./UserFields";

export interface UserEditDraft extends UserIdentityDraft { roleId: string }

/** Profile and single role of the selected user, with the delete entry point. */
export const UserEditForm = ({ form, roles, saving, deleting, onChange, onDelete, onSubmit }: {
  form: UserEditDraft; roles: AdministrationRole[]; saving: boolean; deleting: boolean;
  onChange: (field: keyof UserEditDraft, value: string) => void; onDelete: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="space-y-4">
    <UserFields prefix="edit" form={form} onChange={onChange} />
    <Field label="Rôle" htmlFor="edit-role" hint="Modifier la sélection remplace les rôles actuels. Sans changement, ils sont conservés.">
      <select id="edit-role" className={inputClassName} value={form.roleId} onChange={(event) => onChange("roleId", event.target.value)}>
        <option value="">Aucun rôle</option>
        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
      </select>
    </Field>
    <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <DeleteButton label="Supprimer l’utilisateur" variant="outline" loading={deleting} onClick={onDelete} />
      <SaveButton type="submit" label="Enregistrer" loading={saving} />
    </div>
  </AdministrationMutationForm>
);
