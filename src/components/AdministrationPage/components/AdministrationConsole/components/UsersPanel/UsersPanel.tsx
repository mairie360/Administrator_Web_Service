"use client";

import { useState, type FormEvent } from "react";
import { CreateButton, DataState, ErrorAlert } from "@mairie360/lib-components/primitives";
import { administrationApi, type AdministrationRole, type AdministrationUser, type AdministrationUsersPage } from '@/lib/administration-api';
import { ActionButton } from '@/components/AdministrationPage/components/ActionButton';
import { Panel } from '@/components/AdministrationPage/components/Panel';
import { ConfirmModal } from '../ConfirmModal';
import { type RunAction } from '../../types';
import { useUsersList } from './use-users-list';
import { UsersSearch } from './components/UsersSearch';
import { UsersTable } from './components/UsersTable';
import { UsersPagination } from './components/UsersPagination';
import { UserCreateForm, emptyUserCreateDraft, type UserCreateDraft } from './components/UserCreateForm';
import { UserEditForm, type UserEditDraft } from './components/UserEditForm';
import { UserPasswordReset, type PasswordDraft } from './components/UserPasswordReset';
import { RoleChangeWarning } from './components/RoleChangeWarning';

const emptyPassword: PasswordDraft = { password: "", confirmation: "" };

/** Users tab: searchable paginated table, the create / edit editor, password reset and deletion. */
export function UsersPanel({ roles, busyAction, runAction, onTotalChange, initialPage, initialError, initialSearch, onInitialReadConsumed }: {
  initialPage?: AdministrationUsersPage | null;
  initialError?: string | null;
  initialSearch?: string;
  onInitialReadConsumed?: () => void;
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  onTotalChange: (total: number | null) => void;
}) {
  const list = useUsersList({ initialPage, initialError, initialSearch, onInitialReadConsumed, onTotalChange, busyAction });
  const { usersPage, setUsersPage, usersLoading, usersError, usersMutationConfirmed, loadUsers } = list;
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdministrationUser | null>(null);
  const [roleChangePending, setRoleChangePending] = useState(false);
  const [userSaveWarning, setUserSaveWarning] = useState<string[] | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdministrationUser | null>(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState<{ user: AdministrationUser; password: string } | null>(null);
  const [createForm, setCreateForm] = useState<UserCreateDraft>(emptyUserCreateDraft);
  const [editForm, setEditForm] = useState<UserEditDraft>({ first_name: "", last_name: "", email: "", phone_number: "", roleId: "" });
  const [passwordForm, setPasswordForm] = useState<PasswordDraft>(emptyPassword);

  const selectUser = (user: AdministrationUser) => {
    if (busyAction !== null) return;
    setSelectedUser(user);
    setRoleChangePending(false);
    setUserSaveWarning(null);
    setEditorMode("edit");
    setPasswordForm(emptyPassword);
    setPasswordResetTarget(null);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone_number: user.phone_number ?? "", roleId: user.roles[0] ? String(user.roles[0].id) : "" });
    window.requestAnimationFrame(() => { document.getElementById("user-editor")?.scrollIntoView({ behavior: "smooth", block: "nearest" }); });
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction("create-user", "Utilisateur créé.", async () => {
      await administrationApi.createUser({ ...createForm, phone_number: createForm.phone_number.trim() || null });
      // POST confirms the write, not a new row or a current total. Invalidate
      // earlier reads and wait for GET before displaying either as fresh.
      list.confirmMutation();
    }, loadUsers);
    if (success) { setCreateForm(emptyUserCreateDraft); setEditorMode(null); }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;
    const user = selectedUser;
    const profile = { first_name: editForm.first_name.trim(), last_name: editForm.last_name.trim(), email: editForm.email.trim(), phone_number: editForm.phone_number.trim() || null };
    const profileChanged = profile.first_name !== user.first_name || profile.last_name !== user.last_name || profile.email !== user.email || profile.phone_number !== (user.phone_number || null);
    const selectedRoleId = editForm.roleId ? Number(editForm.roleId) : null;
    const roleSelectionChanged = roleChangePending || editForm.roleId !== (user.roles[0] ? String(user.roles[0].id) : "");
    const currentRoleIds = selectedUser.roles.map((role) => role.id);
    const roleIdsToRemove = roleSelectionChanged ? currentRoleIds.filter((roleId) => roleId !== selectedRoleId) : [];
    const shouldAddRole = roleSelectionChanged && selectedRoleId !== null && !currentRoleIds.includes(selectedRoleId);

    const success = await runAction("update-user-" + user.id,
      profileChanged || roleIdsToRemove.length > 0 || shouldAddRole ? "Utilisateur mis à jour." : "Aucune modification à enregistrer.",
      async () => {
        setUserSaveWarning(null);
        let confirmedUser = user;
        const applyConfirmation = (change: Partial<AdministrationUser>) => {
          confirmedUser = { ...confirmedUser, ...change };
          const currentUser = confirmedUser;
          // These independent 204 responses are not an atomic transaction.
          // Older list reads must not undo a confirmed profile or role write.
          list.invalidateReads();
          list.setUsersLoading(false);
          setSelectedUser(currentUser);
          setUsersPage((current) => ({ ...current, users: current.users.map((row) => row.id === user.id ? currentUser : row) }));
        };
        if (profileChanged) {
          await administrationApi.updateUser(user.id, profile);
          applyConfirmation(profile);
        }
        const roleWrites = [
          ...roleIdsToRemove.map((roleId) => ({
            label: `Retrait du rôle « ${user.roles.find((role) => role.id === roleId)?.name} »`,
            perform: async () => {
              await administrationApi.removeRoleFromUser(user.id, roleId);
              applyConfirmation({ roles: confirmedUser.roles.filter((role) => role.id !== roleId) });
            },
          })),
          ...(shouldAddRole && selectedRoleId !== null ? [{
            label: `Ajout du rôle « ${roles.find((role) => role.id === selectedRoleId)?.name} »`,
            perform: async () => {
              const selectedRole = roles.find((role) => role.id === selectedRoleId);
              if (!selectedRole) throw new Error("Le rôle sélectionné n’est plus disponible. Actualisez les rôles.");
              await administrationApi.addRoleToUser(user.id, selectedRoleId);
              applyConfirmation({ roles: [...confirmedUser.roles, { id: selectedRole.id, name: selectedRole.name }] });
            },
          }] : []),
        ];
        // A fast failure must not unlock selection while another write is still
        // pending. Record each confirmation before allowing an explicit retry.
        const outcomes = await Promise.allSettled(roleWrites.map((write) => write.perform()));
        const failures = outcomes.flatMap((outcome, index) => outcome.status === "rejected" ? [`${roleWrites[index].label} non confirmé.`] : []);
        if (failures.length > 0) {
          setRoleChangePending(true);
          setUserSaveWarning([
            profileChanged ? "Le profil est enregistré." : "Le profil est inchangé.",
            ...outcomes.flatMap((outcome, index) => outcome.status === "fulfilled" ? [`${roleWrites[index].label} confirmé.`] : []),
            ...failures,
          ]);
          const failure = outcomes.find((outcome) => outcome.status === "rejected");
          if (failure?.status === "rejected") throw failure.reason;
        }
        setRoleChangePending(false);
      });
    if (!success) return;
    setEditForm((current) => ({ ...current, ...profile, phone_number: profile.phone_number ?? "" }));
  };

  const confirmUserDeletion = () => {
    if (!userToDelete) return;
    const user = userToDelete;
    void runAction("delete-user-" + user.id, "Utilisateur supprimé.", async () => {
      await administrationApi.deleteUser(user.id);
      list.confirmMutation();
      // The successful DELETE confirms only this removal. Other rows stay
      // available, while totals/pagination await their server readback.
      setUsersPage((current) => ({ ...current, users: current.users.filter((entry) => entry.id !== user.id) }));
    }, async () => {
      setSelectedUser(null);
      setEditorMode(null);
      await loadUsers();
    }).then((success) => { if (success) setUserToDelete(null); });
  };

  const requestPasswordReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser || passwordForm.password !== passwordForm.confirmation) return;
    setPasswordResetTarget({ user: selectedUser, password: passwordForm.password });
  };
  const confirmPasswordReset = () => {
    if (!passwordResetTarget) return;
    const { user, password } = passwordResetTarget;
    void runAction("reset-user-password-" + user.id, "Mot de passe modifié. Les sessions ont été révoquées.", () => administrationApi.resetUserPassword(user.id, password))
      .then((success) => { if (!success) return; setPasswordForm(emptyPassword); setPasswordResetTarget(null); });
  };

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,0.5fr)]">
      <Panel title="Utilisateurs" description="Sélectionnez une personne dans le tableau pour modifier ses informations."
        action={<CreateButton label="Nouvel utilisateur" onClick={() => { setSelectedUser(null); setEditorMode("create"); setPasswordForm(emptyPassword); setPasswordResetTarget(null); }} />}>
        <div className="space-y-4">
          <UsersSearch value={list.searchInput} onType={list.typeSearch} onSubmit={list.submitSearch} />
          {usersError && (
            <ErrorAlert role="alert" size="s"
              title={usersMutationConfirmed ? "L’action est enregistrée, mais les utilisateurs n’ont pas pu être actualisés." : usersError}
              description={<>{usersMutationConfirmed ? `${usersError} Ne répétez pas l’action.` : "Dernières données reçues, si disponibles."}<span className="mt-3 block"><ActionButton variant="secondary" disabled={usersLoading} onClick={() => void loadUsers()}>Réessayer le chargement des utilisateurs</ActionButton></span></>} />
          )}
          {usersLoading ? <DataState state="loading" title="Chargement des utilisateurs…" />
            : usersPage.users.length === 0 ? (usersError ? null : <DataState state="empty" size="s" title={list.search ? "Aucun utilisateur ne correspond à cette recherche." : "Aucun utilisateur disponible."} description={null} />)
            : <UsersTable users={usersPage.users} selectedId={selectedUser?.id ?? null} locked={busyAction !== null} onSelect={selectUser} />}
          <UsersPagination usersPage={usersPage} page={list.page} loading={usersLoading} received={list.hasReceivedUsers} mutationConfirmed={usersMutationConfirmed} onChange={list.changePage} />
        </div>
      </Panel>

      <Panel title={editorMode === "create" ? "Créer un utilisateur" : selectedUser ? "Modifier l’utilisateur" : "Fiche utilisateur"}
        description={editorMode === "create" ? "Créez un nouveau compte." : selectedUser ? selectedUser.first_name + " " + selectedUser.last_name : "Cliquez sur une ligne du tableau pour ouvrir la fiche."}
        className="h-fit">
        <div id="user-editor">
          {editorMode === "create" ? (
            <UserCreateForm form={createForm} saving={busyAction === "create-user"} onChange={(field, value) => setCreateForm((current) => ({ ...current, [field]: value }))} onCancel={() => setEditorMode(null)} onSubmit={handleCreate} />
          ) : selectedUser ? (
            <div className="space-y-6">
              {userSaveWarning && <RoleChangeWarning messages={userSaveWarning} />}
              <UserEditForm form={editForm} roles={roles} saving={busyAction === "update-user-" + selectedUser.id} deleting={busyAction === "delete-user-" + selectedUser.id}
                onChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))} onDelete={() => setUserToDelete(selectedUser)} onSubmit={handleUpdate} />
              <UserPasswordReset form={passwordForm} busy={busyAction === "reset-user-password-" + selectedUser.id} onChange={setPasswordForm} onSubmit={requestPasswordReset} />
            </div>
          ) : (
            <DataState state="empty" size="s" title="Sélectionnez un utilisateur dans le tableau." description={null} />
          )}
        </div>
      </Panel>

      <ConfirmModal open={userToDelete !== null} title="Supprimer cet utilisateur ?"
        description={userToDelete ? `Le compte de « ${userToDelete.first_name} ${userToDelete.last_name} » (${userToDelete.email}) sera définitivement supprimé. Cette action est irréversible.` : ""}
        confirmLabel="Supprimer l’utilisateur" busy={userToDelete !== null && busyAction === "delete-user-" + userToDelete.id}
        onCancel={() => setUserToDelete(null)} onConfirm={confirmUserDeletion} />
      <ConfirmModal open={passwordResetTarget !== null} tone="security" title="Confirmer la réinitialisation ?"
        description={passwordResetTarget ? `Le mot de passe de « ${passwordResetTarget.user.first_name} ${passwordResetTarget.user.last_name} » sera remplacé. Toutes ses sessions actives seront déconnectées.` : ""}
        confirmLabel="Réinitialiser" busy={passwordResetTarget !== null && busyAction === "reset-user-password-" + passwordResetTarget.user.id}
        onCancel={() => setPasswordResetTarget(null)} onConfirm={confirmPasswordReset} />
    </fieldset>
  );
}
