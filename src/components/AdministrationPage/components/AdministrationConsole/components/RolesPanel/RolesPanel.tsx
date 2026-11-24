"use client";

import { useState } from "react";
import { ConfirmModal, CreateButton, Panel } from "@mairie360/lib-components/primitives";
import { administrationApi, type AdministrationRole } from '@/lib/administration-api';
import { type RunAction } from '../../types';
import { RolesTable } from './components/RolesTable';
import { RoleModal, type RoleDraft } from './components/RoleModal';

/** F17: what deleting a role means, decided before asking. */
type Deletion =
  | { kind: "protected"; role: AdministrationRole }
  | { kind: "assigned"; role: AdministrationRole; accounts: number }
  | { kind: "free"; role: AdministrationRole };

/** Number of accounts holding the role (the list filtered by role, one row read for its total). */
async function holdersOf(role: AdministrationRole) {
  const page = await administrationApi.listUsers({ roleId: role.id, pageSize: 1 });
  return page.total;
}

/**
 * Roles tab, V2 (MAIR-916): the roles table, the role modal for the creation (« Nouveau rôle ») and the
 * edition (a click on the row, its name or its pencil), and the three cases of the deletion: system role
 * impossible to delete, role still held (warning with the number of accounts), otherwise a confirmation.
 */
export function RolesPanel({ roles, loading, busyAction, runAction, refreshRoles, onRoleDeleted }: {
  roles: AdministrationRole[] | null;
  loading: boolean;
  busyAction: string | null;
  runAction: RunAction;
  refreshRoles: () => Promise<void>;
  onRoleDeleted: (roleId: number) => void;
}) {
  const locked = busyAction !== null;
  const [target, setTarget] = useState<AdministrationRole | "new" | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);

  const save = (draft: RoleDraft) => {
    if (target === null) return Promise.resolve(false);
    if (target === "new") return runAction("save-role", "Rôle créé", () => administrationApi.createRole(draft), refreshRoles);
    const change: Partial<RoleDraft> = {};
    if (draft.name !== target.name) change.name = draft.name;
    if (draft.description !== target.description) change.description = draft.description;
    if (draft.can_be_deleted !== (target.can_be_deleted !== false)) change.can_be_deleted = draft.can_be_deleted;
    const before = target.modules ?? [];
    if (draft.modules.length !== before.length || draft.modules.some((module) => !before.includes(module))) change.modules = draft.modules;
    return runAction("save-role", `Les droits de « ${draft.name} » sont à jour.`, () => administrationApi.updateRole(target.id, change), refreshRoles);
  };

  const askDeletion = (role: AdministrationRole) => {
    if (role.can_be_deleted === false) { setDeletion({ kind: "protected", role }); return; }
    void runAction(`check-role-${role.id}`, "", async () => {
      const accounts = await holdersOf(role);
      setDeletion(accounts > 0 ? { kind: "assigned", role, accounts } : { kind: "free", role });
    });
  };
  const confirmDeletion = () => {
    if (!deletion || deletion.kind === "protected") return;
    const role = deletion.role;
    void runAction(`delete-role-${role.id}`, "Rôle supprimé", async () => {
      await administrationApi.deleteRole(role.id);
      onRoleDeleted(role.id);
    }, refreshRoles).then((success) => { if (success) setDeletion(null); });
  };

  return (
    <>
      <Panel className="administration-panel" title="Rôles" description="Modèles d’accès attribués aux comptes des agents." flush
        action={<CreateButton label="Nouveau rôle" disabled={locked} onClick={() => setTarget("new")} />}>
        <RolesTable roles={roles} loading={loading} locked={locked} selectedId={target && target !== "new" ? target.id : null}
          onOpen={setTarget} onDelete={askDeletion} onRetry={() => void runAction("refresh-roles", "Rôles actualisés.", refreshRoles)} />
      </Panel>
      <RoleModal target={target} roles={roles ?? []} saving={busyAction === "save-role"} onClose={() => setTarget(null)} onSave={save} />
      {deletion?.kind === "protected" ? (
        <ConfirmModal role="alertdialog" open title="Suppression impossible" destructive={false} confirmLabel="Compris"
          message={`Le rôle « ${deletion.role.name} » est un rôle système : il ne peut pas être supprimé.`}
          onCancel={() => setDeletion(null)} onConfirm={() => setDeletion(null)} />
      ) : (
        <ConfirmModal role="alertdialog" open={deletion !== null} title={deletion?.kind === "assigned" ? "Rôle encore utilisé" : "Supprimer le rôle ?"}
          message={deletion?.kind === "assigned"
            ? `Le rôle « ${deletion.role.name} » est attribué à ${deletion.accounts} compte${deletion.accounts > 1 ? "s" : ""}. Le supprimer leur retire ce rôle.`
            : deletion ? `Le rôle « ${deletion.role.name} » sera définitivement supprimé.` : ""}
          confirmLabel="Supprimer" busy={deletion !== null && busyAction === `delete-role-${deletion.role.id}`}
          onCancel={() => setDeletion(null)} onConfirm={confirmDeletion} />
      )}
    </>
  );
}
