"use client";

import { useState, type FormEvent } from "react";
import { RefreshButton } from "@mairie360/lib-components/primitives";
import { administrationApi, type AdministrationRole } from "@/lib/administration-api";
import { Panel } from "../shared/controls";
import { ConfirmModal } from "../shared/confirm-modal";
import { type RunAction } from "../shared/types";
import { RolesList } from "./RolesList";
import { RoleForm, roleFormDescription, roleFormTitle, type RoleDraft, type RoleWriteMode } from "./RoleForm";

const emptyRole: RoleDraft = { name: "", description: "", can_be_deleted: true };

/** Roles tab: the list, the create / edit form and the deletion confirmation. */
export function RolesPanel({ roles, loading, busyAction, runAction, refreshRoles, onRoleDeleted }: {
  roles: AdministrationRole[] | null;
  loading: boolean;
  busyAction: string | null;
  runAction: RunAction;
  refreshRoles: () => Promise<void>;
  onRoleDeleted: (roleId: number) => void;
}) {
  const [mode, setMode] = useState<RoleWriteMode>("create");
  const [roleId, setRoleId] = useState("");
  const [form, setForm] = useState<RoleDraft>(emptyRole);
  const [roleToDelete, setRoleToDelete] = useState<AdministrationRole | null>(null);

  const resetForm = () => { setMode("create"); setRoleId(""); setForm(emptyRole); };
  const editRole = (role: AdministrationRole) => {
    setMode("replace");
    setRoleId(String(role.id));
    setForm({ name: role.name, description: role.description, can_be_deleted: role.can_be_deleted });
    document.getElementById("role-form")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = { name: form.name.trim(), description: form.description.trim(), can_be_deleted: form.can_be_deleted };
    const action = mode === "create"
      ? () => administrationApi.createRole(input)
      : mode === "replace" ? () => administrationApi.replaceRole(Number(roleId), input) : () => administrationApi.updateRole(Number(roleId), input);
    const success = await runAction("save-role", mode === "create" ? "Rôle créé." : "Rôle mis à jour.", action, refreshRoles);
    if (success) resetForm();
  };
  const confirmDeletion = () => {
    if (!roleToDelete) return;
    const role = roleToDelete;
    void runAction(`delete-role-${role.id}`, "Rôle supprimé.", async () => {
      await administrationApi.deleteRole(role.id);
      onRoleDeleted(role.id);
    }, refreshRoles).then((success) => {
      if (success) {
        setRoleToDelete(null);
        if (roleId === String(role.id)) resetForm();
      }
    });
  };

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
      <Panel title="Rôles disponibles" description="Consultez et gérez les rôles disponibles."
        action={<RefreshButton label="Actualiser" variant="outline" tone="neutral" loading={busyAction === "refresh-roles"} onClick={() => void runAction("refresh-roles", "Rôles actualisés.", refreshRoles)} />}>
        <RolesList roles={roles} loading={loading} busyAction={busyAction} onEdit={editRole} onDelete={setRoleToDelete} />
      </Panel>
      <Panel title={roleFormTitle(mode)} description={roleFormDescription(mode)} className="h-fit">
        <RoleForm mode={mode} form={form} saving={busyAction === "save-role"} onModeChange={setMode} onChange={setForm} onCancel={resetForm} onSubmit={handleSubmit} />
      </Panel>
      <ConfirmModal
        open={roleToDelete !== null}
        title="Supprimer ce rôle ?"
        description={roleToDelete ? `Le rôle « ${roleToDelete.name} » sera définitivement supprimé. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer le rôle"
        busy={roleToDelete !== null && busyAction === `delete-role-${roleToDelete.id}`}
        onCancel={() => setRoleToDelete(null)}
        onConfirm={confirmDeletion}
      />
    </fieldset>
  );
}
