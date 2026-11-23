"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, ConfirmModal, ErrorAlert, Pagination, Panel } from "@mairie360/lib-components/primitives";
import { administrationApi, USERS_PAGE_SIZE, type AdministrationRole, type AdministrationService, type AdministrationUser, type AdministrationUsersPage } from '@/lib/administration-api';
import { type RunAction } from '../../types';
import { useUsersList } from './use-users-list';
import { fullName } from './users-model';
import { UsersToolbar } from './components/UsersToolbar';
import { UsersTable } from './components/UsersTable';
import { UserRecordModal } from './components/UserRecordModal';
import { UserFormModal, emptyUserCreateDraft, type UserCreateDraft, type UserEditDraft } from './components/UserFormModal';


/**
 * Users tab, V2 (MAIR-885, MAIR-894, MAIR-904, MAIR-923): search, filters and order over the whole list,
 * 6 rows per page, rows opening the user record (sessions included), suspension, creation and edition in
 * modals, deletion always confirmed and never of one's own account.
 */
export function UsersPanel({ roles, busyAction, runAction, onTotalChange, currentUserId, refreshSignal = 0, initialPage, initialError, initialSearch, onInitialReadConsumed }: {
  initialPage?: AdministrationUsersPage | null;
  initialError?: string | null;
  initialSearch?: string;
  onInitialReadConsumed?: () => void;
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  onTotalChange: (total: number | null) => void;
  /** The signed-in administrator. */
  currentUserId: number | null;
  /** Incremented by the header « Actualiser »: the visible page is read again. */
  refreshSignal?: number;
}) {
  const list = useUsersList({ initialPage, initialError, initialSearch, onInitialReadConsumed, onTotalChange, busyAction });
  const { usersPage, setUsersPage, usersLoading, usersError, loadUsers } = list;
  const locked = busyAction !== null;
  useEffect(() => { if (refreshSignal > 0) void loadUsers(); }, [refreshSignal]); // eslint-disable-line react-hooks/exhaustive-deps
  const [recordId, setRecordId] = useState<number | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editedUser, setEditedUser] = useState<AdministrationUser | null>(null);
  const [userSaveWarning, setUserSaveWarning] = useState<string[] | null>(null);
  const [roleChangePending, setRoleChangePending] = useState(false);
  const [userToDelete, setUserToDelete] = useState<AdministrationUser | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<AdministrationUser | null>(null);
  const [createForm, setCreateForm] = useState<UserCreateDraft>(emptyUserCreateDraft);
  const [editForm, setEditForm] = useState<UserEditDraft>({ first_name: "", last_name: "", email: "", phone_number: "", serviceId: "", roleId: "" });
  // MAIR-923: the services offered by the user form, read when it opens; a failed read only leaves « Aucun service ».
  const [services, setServices] = useState<AdministrationService[]>([]);
  useEffect(() => {
    if (formMode === null) return;
    let current = true;
    administrationApi.listServices().then((received) => { if (current) setServices(received); }, () => undefined);
    return () => { current = false; };
  }, [formMode]);
  const record = usersPage.users.find((user) => user.id === recordId) ?? null;

  const replaceRow = (userId: number, change: Partial<AdministrationUser>) =>
    setUsersPage((current) => ({ ...current, users: current.users.map((row) => row.id === userId ? { ...row, ...change } : row) }));

  const openEdit = (user: AdministrationUser) => {
    if (locked) return;
    setEditedUser(user);
    setRoleChangePending(false);
    setUserSaveWarning(null);
    setEditForm({ first_name: user.first_name, last_name: user.last_name, email: user.email, phone_number: user.phone_number ?? "", serviceId: user.service ? String(user.service.id) : "", roleId: user.roles[0] ? String(user.roles[0].id) : "" });
    setFormMode("edit");
  };
  const closeForm = () => { setFormMode(null); setEditedUser(null); setUserSaveWarning(null); };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction("create-user", `Compte créé : ${createForm.first_name.trim()} ${createForm.last_name.trim()}`, async () => {
      const { serviceId, ...account } = createForm;
      const id = await administrationApi.createUser({ ...account, phone_number: account.phone_number.trim() || null });
      // MAIR-923: the service is attached once the account exists.
      if (serviceId && id !== null) await administrationApi.setUserService(id, Number(serviceId));
      // POST confirms the write, not a new row or a current total. Invalidate
      // earlier reads and wait for GET before displaying either as fresh.
      list.confirmMutation();
    }, loadUsers);
    if (success) { setCreateForm(emptyUserCreateDraft); setFormMode(null); }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editedUser) return;
    const user = editedUser;
    const profile = { first_name: editForm.first_name.trim(), last_name: editForm.last_name.trim(), email: editForm.email.trim(), phone_number: editForm.phone_number.trim() || null };
    const profileChanged = profile.first_name !== user.first_name || profile.last_name !== user.last_name || profile.email !== user.email || profile.phone_number !== (user.phone_number || null);
    const selectedRoleId = editForm.roleId ? Number(editForm.roleId) : null;
    const roleSelectionChanged = roleChangePending || editForm.roleId !== (user.roles[0] ? String(user.roles[0].id) : "");
    const currentRoleIds = user.roles.map((role) => role.id);
    const roleIdsToRemove = roleSelectionChanged ? currentRoleIds.filter((roleId) => roleId !== selectedRoleId) : [];
    const shouldAddRole = roleSelectionChanged && selectedRoleId !== null && !currentRoleIds.includes(selectedRoleId);
    const selectedServiceId = editForm.serviceId ? Number(editForm.serviceId) : null;
    const serviceChanged = selectedServiceId !== (user.service?.id ?? null);
    const changed = profileChanged || serviceChanged || roleIdsToRemove.length > 0 || shouldAddRole;

    const success = await runAction("update-user-" + user.id,
      changed ? `Le compte de ${profile.first_name} ${profile.last_name} est à jour.` : "Aucune modification à enregistrer.",
      async () => {
        setUserSaveWarning(null);
        let confirmedUser = user;
        const applyConfirmation = (change: Partial<AdministrationUser>) => {
          confirmedUser = { ...confirmedUser, ...change };
          // These independent 204 responses are not an atomic transaction.
          // Older list reads must not undo a confirmed profile or role write.
          list.invalidateReads();
          list.setUsersLoading(false);
          setEditedUser(confirmedUser);
          replaceRow(user.id, confirmedUser);
        };
        if (profileChanged) {
          await administrationApi.updateUser(user.id, profile);
          applyConfirmation(profile);
        }
        if (serviceChanged) {
          await administrationApi.setUserService(user.id, selectedServiceId);
          const service = services.find((entry) => entry.id === selectedServiceId);
          applyConfirmation({ service: service ? { id: service.id, name: service.name } : null });
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
        // A fast failure must not unlock the form while another write is still
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
    if (success) closeForm();
  };

  const confirmUserDeletion = () => {
    if (!userToDelete) return;
    const user = userToDelete;
    void runAction("delete-user-" + user.id, "Utilisateur supprimé", async () => {
      await administrationApi.deleteUser(user.id);
      list.confirmMutation();
      // The successful DELETE confirms only this removal. Other rows stay
      // available, while totals/pagination await their server readback.
      setUsersPage((current) => ({ ...current, users: current.users.filter((entry) => entry.id !== user.id) }));
    }, async () => {
      setRecordId(null);
      await loadUsers();
    }).then((success) => { if (success) setUserToDelete(null); });
  };

  /** F10: suspending closes every session (warning notification); reactivating is a success. */
  const toggleSuspension = (user: AdministrationUser) => {
    if (user.account_status === "suspended") {
      void runAction("reactivate-user-" + user.id, "Compte réactivé", async () => {
        await administrationApi.reactivateUser(user.id);
        replaceRow(user.id, { account_status: "active", status: "offline" });
      });
      return;
    }
    setUserToSuspend(user);
  };
  const confirmSuspension = () => {
    if (!userToSuspend) return;
    const user = userToSuspend;
    void runAction("suspend-user-" + user.id, "Compte suspendu : toutes ses sessions ont été fermées.", async () => {
      await administrationApi.suspendUser(user.id);
      replaceRow(user.id, { account_status: "suspended", status: "suspended", active_sessions: 0 });
    }).then((success) => { if (success) setUserToSuspend(null); });
  };

  // A refresh keeps the confirmed rows on screen; a refused refresh says so above them.
  const hasRows = usersPage.users.length > 0;
  const tableState = usersLoading && !hasRows ? "loading" : usersError && !hasRows ? "error" : !hasRows ? "empty" : "default";

  return (
    <div className="min-w-0 space-y-4">
      <UsersToolbar searchInput={list.searchInput} status={list.status} roleId={list.roleId} roles={roles} locked={locked}
        onType={list.typeSearch} onSubmit={list.submitSearch} onStatus={list.setStatus} onRole={list.setRole}
        onCreate={() => { setEditedUser(null); setFormMode("create"); }} />
      <Panel className="administration-panel" title="Utilisateurs" flush>
        {usersError && hasRows && <div className="px-4 pb-3"><ErrorAlert size="s" role="alert" title={usersError} /></div>}
        <UsersTable users={usersPage.users} state={tableState} sort={list.sort} currentUserId={currentUserId} locked={locked}
          emptyTitle={list.filtered ? "Aucun utilisateur ne correspond" : "Aucun utilisateur"}
          emptyDescription={list.filtered ? "Modifiez la recherche ou les filtres pour élargir les résultats." : undefined}
          emptyAction={list.filtered ? <Button variant="outline" tone="neutral" size="s" onClick={list.clearFilters}>Effacer les filtres</Button> : undefined}
          errorTitle={usersError ?? undefined} onRetry={() => void loadUsers()}
          onSort={list.setSort} onOpen={(user) => setRecordId(user.id)} onEdit={openEdit}
          onToggleSuspension={toggleSuspension} onDelete={(user) => setUserToDelete(user)} />
        {usersPage.total > 0 && (
          <Pagination className="border-t border-[var(--mairie-border)] px-4 py-2.5" page={list.page} pageSize={usersPage.page_size || USERS_PAGE_SIZE}
            total={usersPage.total} loading={usersLoading || locked} itemsLabel="utilisateurs" label="Pagination des utilisateurs" onChange={list.goToPage} />
        )}
      </Panel>

      <UserRecordModal user={record} currentUserId={currentUserId} locked={locked} onClose={() => setRecordId(null)}
        onEdit={openEdit} onToggleSuspension={toggleSuspension} onDelete={(user) => setUserToDelete(user)}
        onRevoke={(action, message) => runAction("revoke-sessions-" + (record?.id ?? 0), message, action)}
        onActiveCountChange={(userId, count) => replaceRow(userId, { active_sessions: count })} />
      <UserFormModal mode={formMode} name={editedUser ? fullName(editedUser) : undefined} roles={roles} services={services} createForm={createForm} editForm={editForm}
        saving={busyAction === "create-user" || (editedUser !== null && busyAction === "update-user-" + editedUser.id)}
        warning={userSaveWarning}
        onCreateChange={(field, value) => setCreateForm((current) => ({ ...current, [field]: value }))}
        onEditChange={(field, value) => setEditForm((current) => ({ ...current, [field]: value }))}
        onCreate={handleCreate} onUpdate={handleUpdate} onClose={closeForm} />

      <ConfirmModal role="alertdialog" open={userToDelete !== null} title="Supprimer le compte ?"
        message={userToDelete ? `Le compte de « ${fullName(userToDelete)} » (${userToDelete.email}) sera supprimé et ses sessions fermées.` : ""}
        confirmLabel="Supprimer" busy={userToDelete !== null && busyAction === "delete-user-" + userToDelete.id}
        onCancel={() => setUserToDelete(null)} onConfirm={confirmUserDeletion} />
      <ConfirmModal role="alertdialog" open={userToSuspend !== null} destructive={false} title="Suspendre le compte ?"
        message={userToSuspend ? `${fullName(userToSuspend)} sera déconnecté de tous ses appareils et ne pourra plus se connecter jusqu’à sa réactivation.` : ""}
        confirmLabel="Suspendre" busy={userToSuspend !== null && busyAction === "suspend-user-" + userToSuspend.id}
        onCancel={() => setUserToSuspend(null)} onConfirm={confirmSuspension} />
    </div>
  );
}
