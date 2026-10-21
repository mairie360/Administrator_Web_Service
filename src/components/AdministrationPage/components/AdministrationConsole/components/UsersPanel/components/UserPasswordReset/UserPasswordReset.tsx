"use client";
import { type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { ErrorText, Help, Icon, PanelTitle } from "@mairie360/lib-components/primitives";

import AdministrationMutationForm from '@/components/AdministrationPage/components/AdministrationConsole/components/AdministrationMutationForm';
import { ActionButton } from '@/components/AdministrationPage/components/ActionButton';
import { Field } from '@/components/AdministrationPage/components/Field';
import { inputClassName } from '@/components/AdministrationPage/controls';

export interface PasswordDraft { password: string; confirmation: string }

/** New password twice; the confirmation dialog follows (all sessions are revoked). */
export const UserPasswordReset = ({ form, busy, onChange, onSubmit }: { form: PasswordDraft; busy: boolean; onChange: (form: PasswordDraft) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) => {
  const mismatch = form.confirmation.length > 0 && form.password !== form.confirmation;
  return (
    <AdministrationMutationForm onSubmit={onSubmit} className="space-y-4 border-t border-[var(--mairie-border)] pt-5">
      <div>
        <PanelTitle className="flex items-center gap-2"><Icon icon={KeyRound} size="s" className="text-[var(--mairie-accent)]" />Réinitialiser le mot de passe</PanelTitle>
        <Help size="xs" className="mt-1.5">Définissez le nouveau mot de passe. Toutes les sessions actives seront déconnectées et l’utilisateur devra se reconnecter avec celui-ci.</Help>
      </div>
      <Field label="Nouveau mot de passe" htmlFor="reset-password">
        <input id="reset-password" type="password" minLength={8} maxLength={255} required autoComplete="new-password" className={inputClassName} value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} />
      </Field>
      <Field label="Confirmer le mot de passe" htmlFor="reset-password-confirmation">
        <input id="reset-password-confirmation" type="password" minLength={8} maxLength={255} required autoComplete="new-password" aria-invalid={mismatch} aria-describedby={mismatch ? "password-mismatch" : undefined} className={inputClassName} value={form.confirmation} onChange={(event) => onChange({ ...form, confirmation: event.target.value })} />
      </Field>
      {mismatch && <ErrorText id="password-mismatch" role="alert" size="xs">Les deux mots de passe ne correspondent pas.</ErrorText>}
      <ActionButton type="submit" variant="secondary" fullWidth icon={KeyRound} disabled={form.password.length < 8 || form.password !== form.confirmation} busy={busy}>Réinitialiser le mot de passe</ActionButton>
    </AdministrationMutationForm>
  );
};
