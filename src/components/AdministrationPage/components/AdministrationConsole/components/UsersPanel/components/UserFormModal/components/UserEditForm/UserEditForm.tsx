"use client";
import { type FormEvent } from "react";
import { CancelButton, SaveButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import type { AdministrationRole } from '@/lib/administration-api';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';
import { UserFields, type UserIdentityDraft } from '../UserFields';

export interface UserEditDraft extends UserIdentityDraft { roleId: string }

/** F09: profile and single role of the selected user (the deletion lives in the record and the row). */
export const UserEditForm = ({ form, roles, saving, onChange, onCancel, onSubmit }: {
  form: UserEditDraft; roles: AdministrationRole[]; saving: boolean;
  onChange: (field: keyof UserEditDraft, value: string) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="space-y-4">
    <UserFields prefix="edit" form={form} onChange={onChange} />
    <Field label="Rôle" htmlFor="edit-role" hint="Modifier la sélection remplace les rôles actuels. Sans changement, ils sont conservés.">
      <select id="edit-role" className={inputClassName} value={form.roleId} onChange={(event) => onChange("roleId", event.target.value)}>
        <option value="">Aucun rôle</option>
        {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
      </select>
    </Field>
    <div className="flex justify-end gap-2 pt-1">
      <CancelButton variant="ghost" onClick={onCancel} />
      <SaveButton type="submit" label="Enregistrer" loading={saving} />
    </div>
  </AdministrationMutationForm>
);
