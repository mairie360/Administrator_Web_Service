"use client";
import { useEffect, useState } from "react";
import { Checkbox, ErrorText, FormActions, Panel, SettingToggle } from "@mairie360/lib-components/primitives";

import type { TwoFactorPolicy } from '@/lib/administration-api';

export const sameTwoFactorPolicy = (a: TwoFactorPolicy, b: TwoFactorPolicy) =>
  a.required === b.required && a.totp_allowed === b.totp_allowed && a.passkey_allowed === b.passkey_allowed && a.backup_codes_allowed === b.backup_codes_allowed;

/** At least one way to prove the second factor stays allowed (Core refuses the policy otherwise). */
export const twoFactorPolicyError = (policy: TwoFactorPolicy) =>
  policy.totp_allowed || policy.passkey_allowed ? null : "Autorisez au moins la passkey ou l’application d’authentification.";

export interface TwoFactorPolicyFormProps {
  policy: TwoFactorPolicy | null;
  state: "loading" | "default" | "unavailable";
  saving: boolean;
  onRetry: () => void;
  onSave: (policy: TwoFactorPolicy) => void;
}

/**
 * A1: the second-factor policy of the mairie: mandatory or not, and the allowed methods (passkey,
 * authenticator application, backup codes). « Enregistrer » waits for a change; Annuler gives back the saved policy.
 */
export function TwoFactorPolicyForm({ policy, state, saving, onRetry, onSave }: TwoFactorPolicyFormProps) {
  const [draft, setDraft] = useState<TwoFactorPolicy | null>(policy);
  useEffect(() => { setDraft(policy); }, [policy]);
  const dirty = policy !== null && draft !== null && !sameTwoFactorPolicy(policy, draft);
  const error = draft ? twoFactorPolicyError(draft) : null;
  return (
    <Panel className="administration-panel" title="Double authentification de la mairie" description="Règle appliquée à la connexion de tous les agents."
      state={state === "default" && draft ? "default" : state === "loading" ? "loading" : "unavailable"}
      stateProps={{ title: state === "loading" ? "Chargement de la politique…" : "La politique de double authentification est indisponible.", onRetry }}>
      {draft && (
        <form className="space-y-4" onSubmit={(event) => { event.preventDefault(); if (dirty && !error) onSave(draft); }}>
          <SettingToggle id="two-factor-required" label="Double authentification obligatoire"
            description="Un agent sans second facteur devra en configurer un à sa prochaine connexion."
            checked={draft.required} disabled={saving} onChange={(required) => setDraft({ ...draft, required })} />
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">Méthodes autorisées</legend>
            <Checkbox label="Passkey" checked={draft.passkey_allowed} disabled={saving} onChange={(event) => setDraft({ ...draft, passkey_allowed: event.target.checked })} />
            <Checkbox label="Application d’authentification" checked={draft.totp_allowed} disabled={saving} onChange={(event) => setDraft({ ...draft, totp_allowed: event.target.checked })} />
            <Checkbox label="Codes de secours" checked={draft.backup_codes_allowed} disabled={saving} onChange={(event) => setDraft({ ...draft, backup_codes_allowed: event.target.checked })} />
          </fieldset>
          {error && <ErrorText role="alert" size="xs">{error}</ErrorText>}
          <FormActions busy={saving} saveDisabled={!dirty || error !== null} onCancel={() => setDraft(policy)}
            status={dirty ? "Modifications non enregistrées" : "Aucune modification à enregistrer."} />
        </form>
      )}
    </Panel>
  );
}
