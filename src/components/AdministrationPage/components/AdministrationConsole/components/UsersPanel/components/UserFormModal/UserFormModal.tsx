"use client";
import { type FormEvent } from "react";
import { Modal } from "@mairie360/lib-components/primitives";

import type { AdministrationRole } from '@/lib/administration-api';
import { UserCreateForm, type UserCreateDraft } from './components/UserCreateForm';
import { UserEditForm, type UserEditDraft } from './components/UserEditForm';
import { UserPasswordReset, type PasswordDraft } from './components/UserPasswordReset';
import { RoleChangeWarning } from './components/RoleChangeWarning';

export interface UserFormModalProps {
  mode: "create" | "edit" | null;
  /** « Prénom Nom » of the edited user. */
  name?: string;
  roles: AdministrationRole[];
  createForm: UserCreateDraft;
  editForm: UserEditDraft;
  passwordForm: PasswordDraft;
  saving: boolean;
  resetting: boolean;
  warning: string[] | null;
  onCreateChange: (field: keyof UserCreateDraft, value: string) => void;
  onEditChange: (field: keyof UserEditDraft, value: string) => void;
  onPasswordChange: (form: PasswordDraft) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onUpdate: (event: FormEvent<HTMLFormElement>) => void;
  onResetPassword: (event: FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

/** F06 / F09: « Nouvel utilisateur » and « Modifier l’utilisateur » in a modal (MAIR-857); Annuler changes nothing. */
export function UserFormModal({ mode, name, roles, createForm, editForm, passwordForm, saving, resetting, warning, onCreateChange, onEditChange, onPasswordChange, onCreate, onUpdate, onResetPassword, onClose }: UserFormModalProps) {
  if (mode === null) return null;
  return mode === "create" ? (
    <Modal open title="Nouvel utilisateur" size="m" onClose={onClose}
      description="Créez le compte, puis attribuez un rôle. Un e-mail d’activation sera envoyé.">
      <UserCreateForm form={createForm} saving={saving} onChange={onCreateChange} onCancel={onClose} onSubmit={onCreate} />
    </Modal>
  ) : (
    <Modal open title="Modifier l’utilisateur" size="m" onClose={onClose}
      description={`${name ?? ""} — l’adresse e-mail sert d’identifiant de connexion.`}>
      <div className="space-y-6">
        {warning && <RoleChangeWarning messages={warning} />}
        <UserEditForm form={editForm} roles={roles} saving={saving} onChange={onEditChange} onCancel={onClose} onSubmit={onUpdate} />
        <UserPasswordReset form={passwordForm} busy={resetting} onChange={onPasswordChange} onSubmit={onResetPassword} />
      </div>
    </Modal>
  );
}
