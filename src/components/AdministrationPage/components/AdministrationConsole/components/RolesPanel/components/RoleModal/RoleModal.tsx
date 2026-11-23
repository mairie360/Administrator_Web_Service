"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Checkbox, FormActions, Modal, TextArea, TextField } from "@mairie360/lib-components/primitives";

import { MODULE_LABELS, ROLE_MODULES, type AdministrationRole, type RoleModule } from '@/lib/administration-api';
import { DESCRIPTION_MAX_LENGTH, NAME_MAX_LENGTH } from '@/lib/text-constraints';

export interface RoleDraft { name: string; description: string; can_be_deleted: boolean; modules: RoleModule[] }

/** A new role opens the dashboard, as Core does when no module is sent. */
const DEFAULT_MODULES: RoleModule[] = ["dashboard"];
const sameModules = (a: RoleModule[], b: RoleModule[]) => a.length === b.length && a.every((module) => b.includes(module));

/** F15 / F16 validation: name required and unique (case and spaces ignored); `null` when valid. */
export function roleNameError(name: string, roles: AdministrationRole[], ownId: number | null): string | null {
  const wanted = name.trim().toLocaleLowerCase("fr");
  if (!wanted) return "Indiquez un nom de rôle.";
  if (roles.some((role) => role.id !== ownId && role.name.trim().toLocaleLowerCase("fr") === wanted)) return "Un rôle porte déjà ce nom.";
  if (/[<>]/.test(name)) return "Le nom ne doit pas contenir les caractères < ou >.";
  return null;
}

export interface RoleModalProps {
  /** `null` = closed, `"new"` = F16, a role = F15. */
  target: AdministrationRole | "new" | null;
  roles: AdministrationRole[];
  saving: boolean;
  onClose: () => void;
  onSave: (draft: RoleDraft) => Promise<boolean>;
}

/**
 * F15 / F16: one modal (size m) to create or edit a role: name, description, system role. « Enregistrer »
 * stays disabled while nothing changed, with the status « Aucune modification à enregistrer » /
 * « Modifications non enregistrées »; errors under the field keep the modal open; Entrée saves, Échap or
 * « Annuler » closes without saving. A system role (Administrateur) cannot be renamed or unprotected (MAIR-678).
 * « Modules accessibles » (MAIR-916): the modules of the navigation its holders open; the Admin role keeps Administration.
 */
export function RoleModal({ target, roles, saving, onClose, onSave }: RoleModalProps) {
  const initial: RoleDraft = target && target !== "new"
    ? { name: target.name, description: target.description, can_be_deleted: target.can_be_deleted !== false, modules: (target.modules ?? []) as RoleModule[] }
    : { name: "", description: "", can_be_deleted: true, modules: DEFAULT_MODULES };
  const [draft, setDraft] = useState<RoleDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const targetKey = target === null ? "" : target === "new" ? "new" : String(target.id);
  useEffect(() => { setDraft(initial); setError(null); }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (target === null) return null;

  const creating = target === "new";
  const system = !creating && target.can_be_deleted === false;
  // The Admin role always opens the administration (Core answers 403 otherwise).
  const adminRole = !creating && target.name === "Admin";
  const dirty = draft.name !== initial.name || draft.description !== initial.description || draft.can_be_deleted !== initial.can_be_deleted
    || !sameModules(draft.modules, initial.modules);
  const toggleModule = (module: RoleModule, checked: boolean) => setDraft({
    ...draft, modules: ROLE_MODULES.filter((known) => known === module ? checked : draft.modules.includes(known)),
  });
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = roleNameError(draft.name, roles, creating ? null : target.id);
    if (problem) { setError(problem); nameRef.current?.focus(); return; }
    if (!creating && !dirty) return;
    if (await onSave({ ...draft, name: draft.name.trim(), description: draft.description.trim() })) onClose();
  };
  return (
    <Modal open title={creating ? "Nouveau rôle" : `Modifier le rôle « ${target.name} »`} size="m" onClose={onClose} initialFocusRef={nameRef}>
      <form className="space-y-4" noValidate onSubmit={(event) => void submit(event)}>
        <TextField ref={nameRef} id="role-name" label="Nom du rôle" required maxLength={NAME_MAX_LENGTH} value={draft.name} disabled={system}
          error={error ?? undefined} hint={system ? "Le rôle Administrateur est indispensable à la console : il ne peut pas être renommé." : undefined}
          onChange={(event) => { setDraft({ ...draft, name: event.target.value }); setError(null); }} />
        <TextArea id="role-description" label="Description" maxLength={DESCRIPTION_MAX_LENGTH} value={draft.description}
          onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        <Checkbox label="Rôle système (ne peut pas être supprimé)" checked={!draft.can_be_deleted} disabled={system}
          onChange={(event) => setDraft({ ...draft, can_be_deleted: !event.target.checked })} />
        <fieldset className="space-y-2" aria-describedby="role-modules-hint">
          <legend className="text-sm font-medium">Modules accessibles</legend>
          <p id="role-modules-hint" className="text-sm text-muted-foreground">Les modules affichés dans la navigation des agents qui ont ce rôle.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ROLE_MODULES.map((module) => (
              <Checkbox key={module} label={MODULE_LABELS[module]} checked={draft.modules.includes(module)}
                disabled={adminRole && module === "admin"}
                onChange={(event) => toggleModule(module, event.target.checked)} />
            ))}
          </div>
        </fieldset>
        <FormActions busy={saving} saveDisabled={!creating && !dirty} saveLabel={creating ? "Créer le rôle" : "Enregistrer"} onCancel={onClose}
          status={creating ? undefined : dirty ? "Modifications non enregistrées" : "Aucune modification à enregistrer."} />
      </form>
    </Modal>
  );
}
