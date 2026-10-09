"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, KeyRound, LoaderCircle, Pencil, Plus, Save, Search, Trash2 } from "lucide-react";
import { administrationApi, type AdministrationRole, type AdministrationUser, type AdministrationUsersPage } from "@/lib/administration-api";
import { administrationErrorMessage } from "@/lib/administration-error";
import { inputClassName, Field, Panel, ActionButton, EmptyState } from "./controls";
import { ConfirmModal } from "./confirm-modal";
import { type RunAction } from "./types";

const emptyUsersPage: AdministrationUsersPage = {
  users: [],
  page: 1,
  page_size: 20,
  total: 0,
  total_pages: 0,
};

export function UsersPanel({
  roles,
  busyAction,
  runAction,
  onTotalChange,
}: {
  roles: AdministrationRole[];
  busyAction: string | null;
  runAction: RunAction;
  onTotalChange: (total: number | null) => void;
}) {
  const [usersPage, setUsersPage] = useState<AdministrationUsersPage>(emptyUsersPage);
  const [hasReceivedUsers, setHasReceivedUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersMutationConfirmed, setUsersMutationConfirmed] = useState(false);
  const usersReadRevision = useRef(0);
  const [editorMode, setEditorMode] = useState<"create" | "edit" | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdministrationUser | null>(null);
  const [roleChangePending, setRoleChangePending] = useState(false);
  const [userSaveWarning, setUserSaveWarning] = useState<string[] | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdministrationUser | null>(null);
  const [passwordResetTarget, setPasswordResetTarget] = useState<{
    user: AdministrationUser;
    password: string;
  } | null>(null);
  const [createForm, setCreateForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    roleId: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmation: "",
  });

  const loadUsers = useCallback(async () => {
    const revision = ++usersReadRevision.current;
    const isCurrent = () => usersReadRevision.current === revision;
    setUsersLoading(true);
    setUsersError(null);

    try {
      const response = await administrationApi.listUsers({ page, search });
      if (!isCurrent()) return;
      setUsersPage(response);
      setHasReceivedUsers(true);
      setUsersMutationConfirmed(false);
      onTotalChange(response.total);

      if (response.total_pages > 0 && page > response.total_pages) {
        setPage(response.total_pages);
      }
    } catch (error) {
      if (isCurrent()) setUsersError(administrationErrorMessage(error));
    } finally {
      if (isCurrent()) setUsersLoading(false);
    }
  }, [onTotalChange, page, search]);

  useEffect(() => {
    void loadUsers();
    return () => { usersReadRevision.current += 1; };
  }, [loadUsers]);

  const selectUser = (user: AdministrationUser) => {
    if (busyAction !== null) return;
    setSelectedUser(user);
    setRoleChangePending(false);
    setUserSaveWarning(null);
    setEditorMode("edit");
    setPasswordForm({ password: "", confirmation: "" });
    setPasswordResetTarget(null);
    setEditForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number ?? "",
      roleId: user.roles[0] ? String(user.roles[0].id) : "",
    });

    window.requestAnimationFrame(() => {
      document.getElementById("user-editor")?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
  };

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextSearch = searchInput.trim();

    if (page === 1 && search === nextSearch) {
      void loadUsers();
      return;
    }

    // Invalidate at submission, before the effect starts the replacement read.
    usersReadRevision.current += 1;
    setSearch(nextSearch);
    setPage(1);
  };

  const changePage = (direction: number) => {
    usersReadRevision.current += 1;
    setPage((current) => Math.max(1, current + direction));
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction(
      "create-user",
      "Utilisateur créé.",
      async () => {
        await administrationApi.createUser({
          ...createForm,
          phone_number: createForm.phone_number.trim() || null,
        });
        // POST confirms the write, not a new row or a current total. Invalidate
        // earlier reads and wait for GET before displaying either as fresh.
        usersReadRevision.current += 1;
        setUsersMutationConfirmed(true);
        onTotalChange(null);
      },
      loadUsers,
    );

    if (success) {
      setCreateForm({
        first_name: "",
        last_name: "",
        email: "",
        phone_number: "",
        password: "",
      });
      setEditorMode(null);
    }
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser) return;

    const user = selectedUser;
    const profile = {
      first_name: editForm.first_name.trim(),
      last_name: editForm.last_name.trim(),
      email: editForm.email.trim(),
      phone_number: editForm.phone_number.trim() || null,
    };
    const profileChanged = profile.first_name !== user.first_name ||
      profile.last_name !== user.last_name || profile.email !== user.email ||
      profile.phone_number !== (user.phone_number || null);
    const selectedRoleId = editForm.roleId ? Number(editForm.roleId) : null;
    const roleSelectionChanged = roleChangePending || editForm.roleId !== (user.roles[0] ? String(user.roles[0].id) : "");
    const currentRoleIds = selectedUser.roles.map((role) => role.id);
    const roleIdsToRemove = roleSelectionChanged
      ? currentRoleIds.filter((roleId) => roleId !== selectedRoleId)
      : [];
    const shouldAddRole =
      roleSelectionChanged && selectedRoleId !== null && !currentRoleIds.includes(selectedRoleId);

    const success = await runAction(
      "update-user-" + user.id,
      profileChanged || roleIdsToRemove.length > 0 || shouldAddRole
        ? "Utilisateur mis à jour." : "Aucune modification à enregistrer.",
      async () => {
        setUserSaveWarning(null);
        let confirmedUser = user;
        const applyConfirmation = (change: Partial<AdministrationUser>) => {
          confirmedUser = { ...confirmedUser, ...change };
          const currentUser = confirmedUser;
          // These independent 204 responses are not an atomic transaction.
          // Older list reads must not undo a confirmed profile or role write.
          usersReadRevision.current += 1;
          setUsersLoading(false);
          setSelectedUser(currentUser);
          setUsersPage((current) => ({
            ...current,
            users: current.users.map((row) => row.id === user.id ? currentUser : row),
          }));
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
        const failures = outcomes.flatMap((outcome, index) => outcome.status === "rejected"
          ? [`${roleWrites[index].label} non confirmé.`] : []);
        if (failures.length > 0) {
          setRoleChangePending(true);
          setUserSaveWarning([
            profileChanged ? "Le profil est enregistré." : "Le profil est inchangé.",
            ...outcomes.flatMap((outcome, index) => outcome.status === "fulfilled"
              ? [`${roleWrites[index].label} confirmé.`] : []),
            ...failures,
          ]);
          const failure = outcomes.find((outcome) => outcome.status === "rejected");
          if (failure?.status === "rejected") throw failure.reason;
        }
        setRoleChangePending(false);
      },
    );

    if (!success) return;

    setEditForm((current) => ({ ...current, ...profile, phone_number: profile.phone_number ?? "" }));
  };

  const confirmUserDeletion = () => {
    if (!userToDelete) return;
    const user = userToDelete;

    void runAction(
      "delete-user-" + user.id,
      "Utilisateur supprimé.",
      async () => {
        await administrationApi.deleteUser(user.id);
        usersReadRevision.current += 1;
        setUsersMutationConfirmed(true);
        onTotalChange(null);
        // The successful DELETE confirms only this removal. Other rows stay
        // available, while totals/pagination await their server readback.
        setUsersPage((current) => ({
          ...current,
          users: current.users.filter((entry) => entry.id !== user.id),
        }));
      },
      async () => {
        setSelectedUser(null);
        setEditorMode(null);
        await loadUsers();
      },
    ).then((success) => {
      if (success) setUserToDelete(null);
    });
  };

  const requestPasswordReset = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedUser || passwordForm.password !== passwordForm.confirmation) return;

    setPasswordResetTarget({
      user: selectedUser,
      password: passwordForm.password,
    });
  };

  const confirmPasswordReset = () => {
    if (!passwordResetTarget) return;
    const { user, password } = passwordResetTarget;

    void runAction(
      "reset-user-password-" + user.id,
      "Mot de passe modifié. Les sessions ont été révoquées.",
      () => administrationApi.resetUserPassword(user.id, password),
    ).then((success) => {
      if (!success) return;
      setPasswordForm({ password: "", confirmation: "" });
      setPasswordResetTarget(null);
    });
  };

  const passwordsMismatch =
    passwordForm.confirmation.length > 0 &&
    passwordForm.password !== passwordForm.confirmation;

  const changeCreate = (field: keyof typeof createForm, value: string) =>
    setCreateForm((current) => ({ ...current, [field]: value }));
  const changeEdit = (field: keyof typeof editForm, value: string) =>
    setEditForm((current) => ({ ...current, [field]: value }));

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(380px,0.5fr)]">
      <Panel
        title="Utilisateurs"
        description="Sélectionnez une personne dans le tableau pour modifier ses informations."
        action={
          <ActionButton
            onClick={() => {
              setSelectedUser(null);
              setEditorMode("create");
              setPasswordForm({ password: "", confirmation: "" });
              setPasswordResetTarget(null);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nouvel utilisateur
          </ActionButton>
        }
      >
        <div className="space-y-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
            role="search"
          >
            <label className="relative block flex-1">
              <span className="sr-only">Rechercher un utilisateur</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
                aria-hidden="true"
              />
              <input
                type="search"
                className={inputClassName + " pl-9"}
                placeholder="Rechercher par nom, prénom ou e-mail"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </label>
            <ActionButton type="submit" variant="secondary">
              Rechercher
            </ActionButton>
          </form>

          {usersError && (
            <div role="alert" className="rounded-lg bg-[#fff7f6] p-4 text-sm text-[#912018]">
              {usersMutationConfirmed && (
                <p className="font-bold">L’action est enregistrée, mais les utilisateurs n’ont pas pu être actualisés.</p>
              )}
              <p>{usersError} {usersMutationConfirmed ? "Ne répétez pas l’action." : "Dernières données reçues, si disponibles."}</p>
              <ActionButton
                className="mt-3"
                variant="secondary"
                disabled={usersLoading}
                onClick={() => void loadUsers()}
              >
                Réessayer le chargement des utilisateurs
              </ActionButton>
            </div>
          )}
          {usersLoading ? (
            <div className="grid min-h-64 place-items-center text-[#667085]">
              <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Chargement" />
            </div>
          ) : usersPage.users.length === 0 ? (usersError ? null : (
            <EmptyState>
              {search
                ? "Aucun utilisateur ne correspond à cette recherche."
                : "Aucun utilisateur disponible."}
            </EmptyState>
          )) : (
            <div className="overflow-x-auto rounded-lg border border-[#e4e1dc]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-[#f8f7f5] text-xs font-semibold uppercase tracking-wide text-[#667085]">
                  <tr>
                    <th className="px-4 py-3">Utilisateur</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Rôle</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="relative w-12 px-4 py-3">
                      <span className="sr-only">Modifier</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe8e3]">
                  {usersPage.users.map((user) => {
                    const selected = selectedUser?.id === user.id;

                    return (
                      <tr
                        key={user.id}
                        tabIndex={busyAction !== null ? -1 : 0}
                        aria-disabled={busyAction !== null}
                        aria-selected={selected}
                        onClick={() => selectUser(user)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            selectUser(user);
                          }
                        }}
                        className={
                          "cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#3c7773]/30 " +
                          (selected
                            ? "bg-[#edf7f6]"
                            : "bg-white hover:bg-[#fafcfb]")
                        }
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-[#344054]">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="mt-0.5 text-xs text-[#98a2b3]">
                            Identifiant #{user.id}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-[#475467]">{user.email}</div>
                          <div className="mt-0.5 text-xs text-[#98a2b3]">
                            {user.phone_number || "Aucun téléphone"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-[#edf5f4] px-2.5 py-1 text-xs font-semibold text-[#315f5c]">
                            {user.roles.map((role) => role.name).join(", ") || "Aucun rôle"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={
                              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " +
                              (user.is_archived
                                ? "bg-[#fef3f2] text-[#b42318]"
                                : "bg-[#ecfdf3] text-[#027a48]")
                            }
                          >
                            {user.is_archived ? "Archivé" : user.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <Pencil className="h-4 w-4 text-[#667085]" aria-hidden="true" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-[#ebe8e3] pt-4 text-sm text-[#667085] sm:flex-row sm:items-center sm:justify-between">
            <span>
              {usersMutationConfirmed
                ? "Total à actualiser"
                : hasReceivedUsers
                  ? `${usersPage.total} utilisateur${usersPage.total > 1 ? "s" : ""}`
                  : usersLoading
                    ? "Nombre d’utilisateurs en cours de chargement"
                    : "Nombre d’utilisateurs indisponible"} · 20 maximum par page
            </span>
            <div className="flex items-center gap-2">
              <ActionButton
                variant="secondary"
                className="h-9 px-2.5"
                disabled={page <= 1 || usersLoading}
                onClick={() => changePage(-1)}
                aria-label="Page précédente"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </ActionButton>
              <span className="min-w-24 text-center font-semibold text-[#344054]">
                {hasReceivedUsers || usersMutationConfirmed
                  ? <>Page {usersPage.page}{usersMutationConfirmed ? " · pagination à actualiser" : ` / ${Math.max(usersPage.total_pages, 1)}`}</>
                  : usersLoading ? "Pagination en cours de chargement" : "Pagination indisponible"}
              </span>
              <ActionButton
                variant="secondary"
                className="h-9 px-2.5"
                disabled={
                  usersLoading ||
                  usersPage.total_pages === 0 ||
                  page >= usersPage.total_pages
                }
                onClick={() => changePage(1)}
                aria-label="Page suivante"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </ActionButton>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title={
          editorMode === "create"
            ? "Créer un utilisateur"
            : selectedUser
              ? "Modifier l’utilisateur"
              : "Fiche utilisateur"
        }
        description={
          editorMode === "create"
            ? "Créez un nouveau compte."
            : selectedUser
              ? selectedUser.first_name + " " + selectedUser.last_name
              : "Cliquez sur une ligne du tableau pour ouvrir la fiche."
        }
        className="h-fit"
      >
        <div id="user-editor">
          {editorMode === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Prénom" htmlFor="create-first-name">
                <input
                  id="create-first-name"
                  required
                  className={inputClassName}
                  value={createForm.first_name}
                  onChange={(event) => changeCreate("first_name", event.target.value)}
                />
              </Field>
              <Field label="Nom" htmlFor="create-last-name">
                <input
                  id="create-last-name"
                  required
                  className={inputClassName}
                  value={createForm.last_name}
                  onChange={(event) => changeCreate("last_name", event.target.value)}
                />
              </Field>
              <Field label="Adresse e-mail" htmlFor="create-email">
                <input
                  id="create-email"
                  type="email"
                  required
                  className={inputClassName}
                  value={createForm.email}
                  onChange={(event) => changeCreate("email", event.target.value)}
                />
              </Field>
              <Field label="Téléphone" htmlFor="create-phone">
                <input
                  id="create-phone"
                  type="tel"
                  className={inputClassName}
                  value={createForm.phone_number}
                  onChange={(event) => changeCreate("phone_number", event.target.value)}
                />
              </Field>
              <Field label="Mot de passe initial" htmlFor="create-password">
                <input
                  id="create-password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  value={createForm.password}
                  onChange={(event) => changeCreate("password", event.target.value)}
                />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <ActionButton variant="ghost" onClick={() => setEditorMode(null)}>
                  Annuler
                </ActionButton>
                <ActionButton type="submit" busy={busyAction === "create-user"}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Créer
                </ActionButton>
              </div>
            </form>
          ) : selectedUser ? (
            <div className="space-y-6">
            {userSaveWarning && (
              <div role="alert" className="rounded-lg bg-[#fffaeb] p-4 text-sm text-[#93370d]">
                <p className="font-bold">Les changements de rôle ne sont pas tous confirmés.</p>
                {userSaveWarning.map((message) => <p key={message} className="mt-1">{message}</p>)}
                <p className="mt-2">La fiche et le tableau conservent les changements confirmés. Vérifiez la sélection puis enregistrez pour reprendre uniquement les changements restants.</p>
              </div>
            )}
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Prénom" htmlFor="edit-first-name">
                <input
                  id="edit-first-name"
                  required
                  className={inputClassName}
                  value={editForm.first_name}
                  onChange={(event) => changeEdit("first_name", event.target.value)}
                />
              </Field>
              <Field label="Nom" htmlFor="edit-last-name">
                <input
                  id="edit-last-name"
                  required
                  className={inputClassName}
                  value={editForm.last_name}
                  onChange={(event) => changeEdit("last_name", event.target.value)}
                />
              </Field>
              <Field label="Adresse e-mail" htmlFor="edit-email">
                <input
                  id="edit-email"
                  type="email"
                  required
                  className={inputClassName}
                  value={editForm.email}
                  onChange={(event) => changeEdit("email", event.target.value)}
                />
              </Field>
              <Field label="Téléphone" htmlFor="edit-phone">
                <input
                  id="edit-phone"
                  type="tel"
                  className={inputClassName}
                  value={editForm.phone_number}
                  onChange={(event) => changeEdit("phone_number", event.target.value)}
                />
              </Field>
              <Field
                label="Rôle"
                htmlFor="edit-role"
                hint="Modifier la sélection remplace les rôles actuels. Sans changement, ils sont conservés."
              >
                <select
                  id="edit-role"
                  className={inputClassName}
                  value={editForm.roleId}
                  onChange={(event) => changeEdit("roleId", event.target.value)}
                >
                  <option value="">Aucun rôle</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <ActionButton
                  variant="danger"
                  busy={busyAction === "delete-user-" + selectedUser.id}
                  onClick={() => setUserToDelete(selectedUser)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                  Supprimer l’utilisateur
                </ActionButton>
                <ActionButton
                  type="submit"
                  busy={busyAction === "update-user-" + selectedUser.id}
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer
                </ActionButton>
              </div>
            </form>
            <form
              onSubmit={requestPasswordReset}
              className="space-y-4 border-t border-[#ebe8e3] pt-5"
            >
              <div>
                <h3 className="flex items-center gap-2 font-bold text-[#344054]">
                  <KeyRound className="h-4 w-4 text-[#315f5c]" aria-hidden="true" />
                  Réinitialiser le mot de passe
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#667085]">
                  Définissez le nouveau mot de passe. Toutes les sessions actives seront
                  déconnectées et l’utilisateur devra se reconnecter avec celui-ci.
                </p>
              </div>
              <Field label="Nouveau mot de passe" htmlFor="reset-password">
                <input
                  id="reset-password"
                  type="password"
                  minLength={8}
                  maxLength={255}
                  required
                  autoComplete="new-password"
                  className={inputClassName}
                  value={passwordForm.password}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field label="Confirmer le mot de passe" htmlFor="reset-password-confirmation">
                <input
                  id="reset-password-confirmation"
                  type="password"
                  minLength={8}
                  maxLength={255}
                  required
                  autoComplete="new-password"
                  aria-invalid={passwordsMismatch}
                  aria-describedby={passwordsMismatch ? "password-mismatch" : undefined}
                  className={inputClassName}
                  value={passwordForm.confirmation}
                  onChange={(event) =>
                    setPasswordForm((current) => ({
                      ...current,
                      confirmation: event.target.value,
                    }))
                  }
                />
              </Field>
              {passwordsMismatch && (
                <p id="password-mismatch" role="alert" className="text-xs font-semibold text-[#b42318]">
                  Les deux mots de passe ne correspondent pas.
                </p>
              )}
              <ActionButton
                type="submit"
                variant="secondary"
                className="w-full"
                disabled={
                  passwordForm.password.length < 8 ||
                  passwordForm.password !== passwordForm.confirmation
                }
                busy={busyAction === "reset-user-password-" + selectedUser.id}
              >
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                Réinitialiser le mot de passe
              </ActionButton>
            </form>
            </div>
          ) : (
            <EmptyState>Sélectionnez un utilisateur dans le tableau.</EmptyState>
          )}
        </div>
      </Panel>

      <ConfirmModal
        open={userToDelete !== null}
        title="Supprimer cet utilisateur ?"
        description={
          userToDelete
            ? `Le compte de « ${userToDelete.first_name} ${userToDelete.last_name} » (${userToDelete.email}) sera définitivement supprimé. Cette action est irréversible.`
            : ""
        }
        confirmLabel="Supprimer l’utilisateur"
        busy={
          userToDelete !== null && busyAction === "delete-user-" + userToDelete.id
        }
        onCancel={() => setUserToDelete(null)}
        onConfirm={confirmUserDeletion}
      />
      <ConfirmModal
        open={passwordResetTarget !== null}
        tone="security"
        title="Confirmer la réinitialisation ?"
        description={
          passwordResetTarget
            ? `Le mot de passe de « ${passwordResetTarget.user.first_name} ${passwordResetTarget.user.last_name} » sera remplacé. Toutes ses sessions actives seront déconnectées.`
            : ""
        }
        confirmLabel="Réinitialiser"
        busy={
          passwordResetTarget !== null &&
          busyAction === "reset-user-password-" + passwordResetTarget.user.id
        }
        onCancel={() => setPasswordResetTarget(null)}
        onConfirm={confirmPasswordReset}
      />
    </fieldset>
  );
}
