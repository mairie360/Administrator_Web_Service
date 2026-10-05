"use client";

import { useState, type FormEvent } from "react";
import { Pencil, RefreshCw, Save, Trash2 } from "lucide-react";
import { administrationApi, type AdministrationRole } from "@/lib/administration-api";
import { inputClassName, textareaClassName, Field, Panel, ActionButton, EmptyState } from "./controls";
import { ConfirmModal } from "./confirm-modal";
import { type RunAction } from "./types";

type RoleWriteMode = "create" | "replace" | "update";

export function RolesPanel({
  roles,
  busyAction,
  runAction,
  refreshRoles,
  onRoleDeleted,
}: {
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  refreshRoles: () => Promise<void>;
  onRoleDeleted: (roleId: number) => void;
}) {
  const [mode, setMode] = useState<RoleWriteMode>("create");
  const [roleId, setRoleId] = useState("");
  const [form, setForm] = useState<{
    name: string;
    description: string;
    can_be_deleted?: boolean | null;
  }>({ name: "", description: "", can_be_deleted: true });
  const [roleToDelete, setRoleToDelete] = useState<AdministrationRole | null>(null);

  const resetForm = () => {
    setMode("create");
    setRoleId("");
    setForm({ name: "", description: "", can_be_deleted: true });
  };

  const editRole = (role: AdministrationRole) => {
    setMode("replace");
    setRoleId(String(role.id));
    setForm({ name: role.name, description: role.description, can_be_deleted: role.can_be_deleted });
    document.getElementById("role-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = {
      name: form.name.trim(),
      description: form.description.trim(),
      can_be_deleted: form.can_be_deleted,
    };
    const action =
      mode === "create"
        ? () => administrationApi.createRole(input)
        : mode === "replace"
          ? () => administrationApi.replaceRole(Number(roleId), input)
          : () => administrationApi.updateRole(Number(roleId), input);
    const success = await runAction(
      "save-role",
      mode === "create" ? "Rôle créé." : "Rôle mis à jour.",
      action,
      refreshRoles,
    );
    if (success) resetForm();
  };

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <Panel
        title="Rôles disponibles"
        description="Consultez et gérez les rôles disponibles."
        action={
          <ActionButton
            variant="secondary"
            busy={busyAction === "refresh-roles"}
            onClick={() => void runAction("refresh-roles", "Rôles actualisés.", refreshRoles)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Actualiser
          </ActionButton>
        }
      >
        {roles.length === 0 ? (
          <EmptyState>Aucun rôle disponible.</EmptyState>
        ) : (
          <div className="divide-y divide-[#ebe8e3] rounded-lg border border-[#e4e1dc]">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#344054]">{role.name}</span>
                    <span className="rounded bg-[#f2f1ee] px-1.5 py-0.5 font-mono text-xs text-[#667085]">
                      #{role.id}
                    </span>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-[#667085]">{role.description}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ActionButton variant="secondary" onClick={() => editRole(role)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Modifier
                  </ActionButton>
                  <ActionButton
                    variant="danger"
                    busy={busyAction === `delete-role-${role.id}`}
                    onClick={() => setRoleToDelete(role)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Supprimer
                  </ActionButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        title={mode === "create" ? "Créer un rôle" : "Modifier le rôle"}
        description={
          mode === "create"
            ? "Ajoutez un nouveau rôle à l’organisation."
            : mode === "replace"
              ? "Remplacez les informations complètes du rôle."
              : "Mettez à jour les informations du rôle."
        }
        className="h-fit"
      >
        <form id="role-form" onSubmit={handleSubmit} className="space-y-4">
          {mode !== "create" && (
            <Field label="Type de modification" htmlFor="role-write-mode">
              <select
                id="role-write-mode"
                className={inputClassName}
                value={mode}
                onChange={(event) => setMode(event.target.value as RoleWriteMode)}
              >
                <option value="replace">Remplacement complet (PUT)</option>
                <option value="update">Mise à jour partielle (PATCH)</option>
              </select>
            </Field>
          )}
          <Field label="Nom" htmlFor="role-name">
            <input
              id="role-name"
              required
              className={inputClassName}
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            />
          </Field>
          <Field label="Description" htmlFor="role-description">
            <textarea
              id="role-description"
              required
              className={textareaClassName}
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />
          </Field>
          <label className="flex items-center gap-3 text-sm font-medium text-[#344054]">
            <input
              type="checkbox"
              checked={form.can_be_deleted === true}
              onChange={(event) =>
                setForm((current) => ({ ...current, can_be_deleted: event.target.checked }))
              }
              className="h-4 w-4 rounded border-[#d0d5dd] accent-[#315f5c]"
            />
            Autoriser la suppression de ce rôle
          </label>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            {mode !== "create" && (
              <ActionButton variant="ghost" onClick={resetForm}>
                Annuler
              </ActionButton>
            )}
            <ActionButton type="submit" busy={busyAction === "save-role"}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {mode === "create" ? "Créer" : "Enregistrer"}
            </ActionButton>
          </div>
        </form>
      </Panel>

      <ConfirmModal
        open={roleToDelete !== null}
        title="Supprimer ce rôle ?"
        description={
          roleToDelete
            ? `Le rôle « ${roleToDelete.name} » sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer le rôle"
        busy={
          roleToDelete !== null && busyAction === `delete-role-${roleToDelete.id}`
        }
        onCancel={() => setRoleToDelete(null)}
        onConfirm={() => {
          if (!roleToDelete) return;
          const role = roleToDelete;
          void runAction(
            `delete-role-${role.id}`,
            "Rôle supprimé.",
            async () => {
              await administrationApi.deleteRole(role.id);
              onRoleDeleted(role.id);
            },
            refreshRoles,
          ).then((success) => {
            if (success) {
              setRoleToDelete(null);
              if (roleId === String(role.id)) resetForm();
            }
          });
        }}
      />
    </fieldset>
  );
}
