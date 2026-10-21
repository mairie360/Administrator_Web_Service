"use client";
import { type FormEvent } from "react";
import { CancelButton, CreateButton } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from "@/components/administration-mutation-form";
import { PASSWORD_MAX_LENGTH } from "@/lib/text-constraints";
import { Field, inputClassName } from "../shared/controls";
import { UserFields, type UserIdentityDraft } from "./UserFields";

export interface UserCreateDraft extends UserIdentityDraft { password: string }
export const emptyUserCreateDraft: UserCreateDraft = { first_name: "", last_name: "", email: "", phone_number: "", password: "" };

/** A new account with its initial password. */
export const UserCreateForm = ({ form, saving, onChange, onCancel, onSubmit }: { form: UserCreateDraft; saving: boolean; onChange: (field: keyof UserCreateDraft, value: string) => void; onCancel: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => (
  <AdministrationMutationForm onSubmit={onSubmit} className="space-y-4">
    <UserFields prefix="create" form={form} onChange={onChange} />
    <Field label="Mot de passe initial" htmlFor="create-password">
      <input id="create-password" type="password" minLength={8} maxLength={PASSWORD_MAX_LENGTH} required autoComplete="new-password" className={inputClassName} value={form.password} onChange={(event) => onChange("password", event.target.value)} />
    </Field>
    <div className="flex justify-end gap-2 pt-1">
      <CancelButton variant="ghost" onClick={onCancel} />
      <CreateButton type="submit" label="Créer" loading={saving} />
    </div>
  </AdministrationMutationForm>
);
