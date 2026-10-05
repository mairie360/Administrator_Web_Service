"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Layers3, LoaderCircle, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { administrationApi, type AdministrationGroup, type AdministrationGroupMember, type AdministrationUser } from "@/lib/administration-api";
import { administrationErrorMessage } from "@/lib/administration-error";
import { inputClassName, textareaClassName, Field, Panel, ActionButton, EmptyState } from "./controls";
import { ConfirmModal } from "./confirm-modal";
import { type RunAction } from "./types";

type GroupDeletionTarget =
  | {
      kind: "member";
      group: AdministrationGroup;
      user: AdministrationGroupMember;
    }
  | {
      kind: "group";
      group: AdministrationGroup;
    };

export function GroupsPanel({
  groups,
  busyAction,
  runAction,
  refreshGroups,
  onGroupDeleted,
}: {
  groups: AdministrationGroup[];
  busyAction: string | null;
  runAction: RunAction;
  refreshGroups: () => Promise<void>;
  onGroupDeleted: (groupId: number) => void;
}) {
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [selectedGroup, setSelectedGroup] = useState<AdministrationGroup | null>(null);
  const [groupUsers, setGroupUsers] = useState<AdministrationGroupMember[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailError, setGroupDetailError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [userOptions, setUserOptions] = useState<AdministrationUser[]>([]);
  const [userOptionsLoading, setUserOptionsLoading] = useState(false);
  const [userOptionsError, setUserOptionsError] = useState<string | null>(null);
  const [deletionTarget, setDeletionTarget] = useState<GroupDeletionTarget | null>(null);
  const groupDetailRevision = useRef(0);
  const groupMembersRevision = useRef(0);
  const selectedGroupRef = useRef<AdministrationGroup | null>(null);
  const groupDetailSelection = useRef<{ requestedId: number | null; selectedId: number | null }>({
    requestedId: null,
    selectedId: null,
  });

  useEffect(() => () => {
    groupDetailRevision.current += 1;
    groupMembersRevision.current += 1;
    selectedGroupRef.current = null;
  }, []);

  const loadGroup = useCallback(async (groupId: number) => {
    const revision = ++groupDetailRevision.current;
    groupMembersRevision.current += 1;
    selectedGroupRef.current = null;
    groupDetailSelection.current.requestedId = groupId;
    setGroupDetailLoading(true);
    setGroupDetailError(null);

    try {
      const [group, users] = await Promise.all([
        administrationApi.getGroup(groupId),
        administrationApi.listGroupUsers(groupId),
      ]);
      if (revision !== groupDetailRevision.current) return;
      selectedGroupRef.current = group;
      groupDetailSelection.current.selectedId = group?.id ?? null;
      setSelectedGroup(group);
      setGroupUsers(users);
      setEditForm({
        name: group?.name ?? "",
        description: group?.description ?? "",
      });
    } catch (error) {
      if (revision === groupDetailRevision.current) setGroupDetailError(administrationErrorMessage(error));
    } finally {
      if (revision === groupDetailRevision.current) setGroupDetailLoading(false);
    }
  }, []);

  const refreshSelectedGroupUsers = useCallback(async () => {
    // A saved retry belongs to this selection, not to whichever group is open later.
    if (!selectedGroup || selectedGroupRef.current !== selectedGroup) return;
    const revision = ++groupMembersRevision.current;
    try {
      const users = await administrationApi.listGroupUsers(selectedGroup.id);
      if (revision === groupMembersRevision.current && selectedGroupRef.current === selectedGroup) setGroupUsers(users);
    } catch (error) {
      if (revision === groupMembersRevision.current && selectedGroupRef.current === selectedGroup) throw error;
    }
  }, [selectedGroup]);

  useEffect(() => {
    if (!selectedGroup) {
      setUserOptions([]);
      return;
    }

    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setUserOptionsLoading(true);
      setUserOptionsError(null);

      try {
        const result = await administrationApi.listUsers({
          page: 1,
          search: memberSearch,
        });
        if (!cancelled) setUserOptions(result.users);
      } catch (error) {
        if (!cancelled) setUserOptionsError(administrationErrorMessage(error));
      } finally {
        if (!cancelled) setUserOptionsLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [memberSearch, selectedGroup]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction(
      "create-group",
      "Groupe créé.",
      () =>
        administrationApi.createGroup({
          name: createForm.name.trim(),
          description: createForm.description.trim(),
        }),
      refreshGroups,
    );
    if (success) setCreateForm({ name: "", description: "" });
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) return;

    let updatedGroup: AdministrationGroup | null = null;
    const success = await runAction(
      "update-group-" + selectedGroup.id,
      "Groupe mis à jour.",
      async () => {
        updatedGroup = await administrationApi.updateGroup(selectedGroup.id, {
          name: editForm.name.trim(),
          description: editForm.description.trim(),
        });
      },
      refreshGroups,
    );

    if (success && updatedGroup) {
      selectedGroupRef.current = updatedGroup;
      setSelectedGroup(updatedGroup);
      const confirmedGroup = updatedGroup as AdministrationGroup;
      groupDetailSelection.current.selectedId = confirmedGroup.id;
      setEditForm({ name: confirmedGroup.name, description: confirmedGroup.description ?? "" });
    }
  };

  const owner = selectedGroup
    ? groupUsers.find((user) => user.id === selectedGroup.owner_id)
    : null;
  const availableUsers = userOptions.filter(
    (user) => !groupUsers.some((member) => member.id === user.id),
  );

  const deletionActionKey = deletionTarget
    ? deletionTarget.kind === "member"
      ? "remove-group-user-" + deletionTarget.user.id
      : "delete-group-" + deletionTarget.group.id
    : null;

  const confirmDeletion = () => {
    if (!deletionTarget) return;

    if (deletionTarget.kind === "member") {
      const { group, user } = deletionTarget;
      void runAction(
        "remove-group-user-" + user.id,
        "Utilisateur retiré du groupe.",
        async () => {
          await administrationApi.removeUserFromGroup(group.id, user.id);
          if (selectedGroupRef.current === group) {
            groupMembersRevision.current += 1;
            setGroupUsers((users) => users.filter((member) => member.id !== user.id));
          }
        },
        refreshSelectedGroupUsers,
      ).then((success) => {
        if (success) setDeletionTarget(null);
      });
      return;
    }

    const { group } = deletionTarget;
    void runAction(
      "delete-group-" + group.id,
      "Groupe supprimé.",
      async () => {
        await administrationApi.deleteGroup(group.id);
        onGroupDeleted(group.id);
        // Only the deleted detail is invalidated. A newer selection and its
        // draft must remain owned by that other group's request.
        if (groupDetailSelection.current.requestedId === group.id) {
          groupDetailRevision.current += 1;
          groupDetailSelection.current.requestedId = null;
          setGroupDetailLoading(false);
          setGroupDetailError(null);
        }
        if (groupDetailSelection.current.selectedId === group.id) {
          groupDetailSelection.current.selectedId = null;
          selectedGroupRef.current = null;
          groupMembersRevision.current += 1;
          setSelectedGroup(null);
          setGroupUsers([]);
          setEditForm({ name: "", description: "" });
          setMemberSearch("");
        }
      },
      refreshGroups,
    ).then((success) => {
      if (success) setDeletionTarget(null);
    });
  };

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="space-y-5">
        <Panel
          title="Groupes"
          description="Sélectionnez un groupe pour modifier ses informations et ses membres."
          action={
            <ActionButton
              variant="secondary"
              busy={busyAction === "refresh-groups"}
              onClick={() =>
                void runAction("refresh-groups", "Groupes actualisés.", refreshGroups)
              }
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Actualiser
            </ActionButton>
          }
        >
          {groups.length === 0 ? (
            <EmptyState>Aucun groupe pour le moment.</EmptyState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {groups.map((group) => (
                <button
                  type="button"
                  key={group.id}
                  onClick={() => void loadGroup(group.id)}
                  className={
                    "rounded-lg border p-4 text-left transition hover:border-[#699c98] hover:bg-[#f8fcfb] " +
                    (selectedGroup?.id === group.id
                      ? "border-[#699c98] bg-[#f5fbfa] ring-2 ring-[#3c7773]/10"
                      : "border-[#e4e1dc] bg-white")
                  }
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-bold text-[#344054]">{group.name}</span>
                    <span className="shrink-0 font-mono text-xs text-[#98a2b3]">#{group.id}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 block text-sm leading-5 text-[#667085]">
                    {group.description || "Aucune description"}
                  </span>
                  <span className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#315f5c]">
                    <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                    Ouvrir le groupe
                  </span>
                </button>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Créer un groupe"
          description="Ajoutez un groupe pour organiser les utilisateurs."
        >
          <form
            onSubmit={handleCreate}
            className="grid gap-4 sm:grid-cols-[1fr_1.5fr_auto] sm:items-end"
          >
            <Field label="Nom" htmlFor="group-name">
              <input
                id="group-name"
                required
                className={inputClassName}
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="group-description">
              <input
                id="group-description"
                required
                className={inputClassName}
                value={createForm.description}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </Field>
            <ActionButton type="submit" busy={busyAction === "create-group"}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Créer
            </ActionButton>
          </form>
        </Panel>
      </div>

      <Panel
        title={selectedGroup ? selectedGroup.name : "Détail du groupe"}
        description={
          selectedGroup
            ? "Modifiez le groupe et gérez ses membres par nom et prénom."
            : "Sélectionnez un groupe pour ouvrir sa fiche."
        }
        className="h-fit"
      >
        {groupDetailLoading ? (
          <div className="grid min-h-52 place-items-center text-[#667085]">
            <LoaderCircle className="h-6 w-6 animate-spin" aria-label="Chargement" />
          </div>
        ) : groupDetailError ? (
          <div className="rounded-lg bg-[#fff7f6] p-4 text-sm text-[#912018]">
            {groupDetailError}
          </div>
        ) : !selectedGroup ? (
          <EmptyState>Cliquez sur un groupe dans la liste.</EmptyState>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleUpdate} className="space-y-4">
              <Field label="Nom du groupe" htmlFor="edit-group-name">
                <input
                  id="edit-group-name"
                  required
                  className={inputClassName}
                  value={editForm.name}
                  onChange={(event) =>
                    setEditForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </Field>
              <Field label="Description" htmlFor="edit-group-description">
                <textarea
                  id="edit-group-description"
                  className={textareaClassName}
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="flex flex-col gap-2 text-xs text-[#667085] sm:flex-row sm:items-center sm:justify-between">
                <span>
                  Propriétaire :{" "}
                  {owner
                    ? owner.first_name + " " + owner.last_name
                    : "utilisateur #" + selectedGroup.owner_id}
                </span>
                <ActionButton
                  type="submit"
                  busy={busyAction === "update-group-" + selectedGroup.id}
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Enregistrer le groupe
                </ActionButton>
              </div>
            </form>

            <div className="border-t border-[#ebe8e3] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-bold text-[#344054]">
                  Membres ({groupUsers.length})
                </h3>
                <ActionButton
                  variant="ghost"
                  busy={busyAction === "refresh-group-users"}
                  onClick={() =>
                    void runAction(
                      "refresh-group-users",
                      "Membres actualisés.",
                      refreshSelectedGroupUsers,
                    )
                  }
                >
                  <RefreshCw className="h-4 w-4" aria-hidden="true" />
                  Actualiser
                </ActionButton>
              </div>

              {groupUsers.length === 0 ? (
                <EmptyState>Ce groupe ne contient aucun utilisateur.</EmptyState>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {groupUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-[#e4e1dc] px-3 py-2.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-[#344054]">
                          {user.first_name} {user.last_name}
                        </span>
                        <span className="block truncate text-xs text-[#98a2b3]">
                          {user.email}
                        </span>
                      </span>
                      <ActionButton
                        variant="ghost"
                        className="h-8 shrink-0 px-2 text-[#b42318]"
                        busy={busyAction === "remove-group-user-" + user.id}
                        onClick={() =>
                          setDeletionTarget({ kind: "member", group: selectedGroup, user })
                        }
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Retirer
                      </ActionButton>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t border-[#ebe8e3] pt-5">
              <Field
                label="Ajouter un utilisateur"
                htmlFor="group-user-search"
                hint="Recherchez par nom, prénom ou adresse e-mail."
              >
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]"
                    aria-hidden="true"
                  />
                  <input
                    id="group-user-search"
                    type="search"
                    className={inputClassName + " pl-9"}
                    placeholder="Ex. Marie Martin"
                    value={memberSearch}
                    onChange={(event) => setMemberSearch(event.target.value)}
                  />
                </div>
              </Field>

              <div className="mt-3">
                {userOptionsLoading ? (
                  <div className="flex items-center gap-2 py-3 text-sm text-[#667085]">
                    <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Recherche des utilisateurs…
                  </div>
                ) : userOptionsError ? (
                  <p className="py-3 text-sm text-[#912018]">{userOptionsError}</p>
                ) : availableUsers.length === 0 ? (
                  <p className="py-3 text-sm text-[#667085]">
                    Aucun utilisateur disponible pour cette recherche.
                  </p>
                ) : (
                  <div className="max-h-60 divide-y divide-[#ebe8e3] overflow-y-auto rounded-lg border border-[#e4e1dc]">
                    {availableUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between gap-3 px-3 py-2.5"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#344054]">
                            {user.first_name} {user.last_name}
                          </span>
                          <span className="block truncate text-xs text-[#98a2b3]">
                            {user.email}
                          </span>
                        </span>
                        <ActionButton
                          variant="secondary"
                          className="h-8 shrink-0 px-2.5"
                          busy={busyAction === "add-group-user-" + user.id}
                          onClick={() =>
                            void runAction(
                              "add-group-user-" + user.id,
                              user.first_name + " " + user.last_name + " ajouté au groupe.",
                              async () => {
                                await administrationApi.addUserToGroup(
                                  selectedGroup.id,
                                  user.id,
                                );
                                if (selectedGroupRef.current === selectedGroup) {
                                  groupMembersRevision.current += 1;
                                  setGroupUsers((users) => users.some((member) => member.id === user.id) ? users : [...users, user]);
                                }
                              },
                              refreshSelectedGroupUsers,
                            )
                          }
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          Ajouter
                        </ActionButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-[#ebe8e3] pt-5">
              <ActionButton
                variant="danger"
                className="w-full"
                busy={busyAction === "delete-group-" + selectedGroup.id}
                onClick={() =>
                  setDeletionTarget({ kind: "group", group: selectedGroup })
                }
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Supprimer ce groupe
              </ActionButton>
            </div>
          </div>
        )}
      </Panel>

      <ConfirmModal
        open={deletionTarget !== null}
        title={
          deletionTarget?.kind === "member"
            ? "Retirer ce membre du groupe ?"
            : "Supprimer ce groupe ?"
        }
        description={
          deletionTarget?.kind === "member"
            ? `« ${deletionTarget.user.first_name} ${deletionTarget.user.last_name} » sera retiré du groupe « ${deletionTarget.group.name} ». Son compte ne sera pas supprimé.`
            : deletionTarget
              ? `Le groupe « ${deletionTarget.group.name} » et ses associations seront définitivement supprimés. Cette action est irréversible.`
              : ""
        }
        confirmLabel={
          deletionTarget?.kind === "member" ? "Retirer du groupe" : "Supprimer le groupe"
        }
        busy={deletionActionKey !== null && busyAction === deletionActionKey}
        onCancel={() => setDeletionTarget(null)}
        onConfirm={confirmDeletion}
      />
    </fieldset>
  );
}
