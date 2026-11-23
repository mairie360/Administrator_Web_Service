"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormActions, Modal, TextField } from "@mairie360/lib-components/primitives";

import type { AdministrationService } from '@/lib/administration-api';
import { NAME_MAX_LENGTH } from '@/lib/text-constraints';

/** Name required, unique whatever its case (Core answers 409 otherwise), no `<` / `>`; `null` when valid. */
export function serviceNameError(name: string, services: AdministrationService[], ownId: number | null): string | null {
  const wanted = name.trim().toLocaleLowerCase("fr");
  if (!wanted) return "Indiquez un nom de service.";
  if (services.some((service) => service.id !== ownId && service.name.trim().toLocaleLowerCase("fr") === wanted)) return "Un service porte déjà ce nom.";
  if (/[<>]/.test(name)) return "Le nom ne doit pas contenir les caractères < ou >.";
  return null;
}

export interface ServiceModalProps {
  /** `null` = closed, `"new"` = creation, a service = renaming. */
  target: AdministrationService | "new" | null;
  services: AdministrationService[];
  saving: boolean;
  onClose: () => void;
  onSave: (name: string) => Promise<boolean>;
}

/** MAIR-923: one modal (size s) to create or rename a service; an error under the field keeps it open. */
export function ServiceModal({ target, services, saving, onClose, onSave }: ServiceModalProps) {
  const initial = target && target !== "new" ? target.name : "";
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const targetKey = target === null ? "" : target === "new" ? "new" : String(target.id);
  useEffect(() => { setName(initial); setError(null); }, [targetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  if (target === null) return null;

  const creating = target === "new";
  const dirty = name.trim() !== initial;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = serviceNameError(name, services, creating ? null : target.id);
    if (problem) { setError(problem); nameRef.current?.focus(); return; }
    if (!creating && !dirty) return;
    if (await onSave(name.trim())) onClose();
  };
  return (
    <Modal open title={creating ? "Nouveau service" : `Renommer le service « ${target.name} »`} size="s" onClose={onClose} initialFocusRef={nameRef}>
      <form className="space-y-4" noValidate onSubmit={(event) => void submit(event)}>
        <TextField ref={nameRef} id="service-name" label="Nom du service" required maxLength={NAME_MAX_LENGTH} value={name} error={error ?? undefined}
          onChange={(event) => { setName(event.target.value); setError(null); }} />
        <FormActions busy={saving} saveDisabled={!creating && !dirty} saveLabel={creating ? "Créer le service" : "Enregistrer"} onCancel={onClose} />
      </form>
    </Modal>
  );
}
