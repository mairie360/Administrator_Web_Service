"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { DataState, DeleteButton, ErrorAlert, RefreshButton } from "@mairie360/lib-components/primitives";
import { administrationApi, type AdministrationGroup, type AdministrationGroupMember, type AdministrationUser } from '@/lib/administration-api';
import { administrationErrorMessage } from '@/lib/administration-error';
import { Panel } from '@/components/AdministrationPage/components/Panel';
import { ConfirmModal } from '../ConfirmModal';
import { type RunAction } from '../../types';
import { GroupsList } from './components/GroupsList';
import { GroupCreateForm, type GroupDraft } from './components/GroupCreateForm';
import { GroupEditForm } from './components/GroupEditForm';
import { GroupMembers } from './components/GroupMembers';
import { GroupMemberSearch } from './components/GroupMemberSearch';
import { useMemberCandidates } from './use-member-candidates';

type GroupDeletionTarget =
  | { kind: "member"; group: AdministrationGroup; user: AdministrationGroupMember }
  | { kind: "group"; group: AdministrationGroup };

const emptyDraft: GroupDraft = { name: "", description: "" };

/** Groups tab: list, creation, the open group (details, members, candidates) and deletions. */
export function GroupsPanel({ groups, loading, busyAction, runAction, refreshGroups, onGroupDeleted }: {
  groups: AdministrationGroup[] | null;
  loading: boolean;
  busyAction: string | null;
  runAction: RunAction;
  refreshGroups: () => Promise<void>;
  onGroupDeleted: (groupId: number) => void;
}) {
  const [createForm, setCreateForm] = useState<GroupDraft>(emptyDraft);
  const [editForm, setEditForm] = useState<GroupDraft>(emptyDraft);
  const [selectedGroup, setSelectedGroup] = useState<AdministrationGroup | null>(null);
  const [groupUsers, setGroupUsers] = useState<AdministrationGroupMember[]>([]);
  const [groupDetailLoading, setGroupDetailLoading] = useState(false);
  const [groupDetailError, setGroupDetailError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [deletionTarget, setDeletionTarget] = useState<GroupDeletionTarget | null>(null);
  const groupDetailRevision = useRef(0);
  const groupMembersRevision = useRef(0);
  const selectedGroupRef = useRef<AdministrationGroup | null>(null);
  const groupDetailSelection = useRef<{ requestedId: number | null; selectedId: number | null }>({ requestedId: null, selectedId: null });
  const candidates = useMemberCandidates(selectedGroup, memberSearch);

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
      const [group, users] = await Promise.all([administrationApi.getGroup(groupId), administrationApi.listGroupUsers(groupId)]);
      if (revision !== groupDetailRevision.current) return;
      selectedGroupRef.current = group;
      groupDetailSelection.current.selectedId = group?.id ?? null;
      setSelectedGroup(group);
      setGroupUsers(users);
      setEditForm({ name: group?.name ?? "", description: group?.description ?? "" });
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

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const success = await runAction("create-group", "Groupe créé.", () => administrationApi.createGroup({ name: createForm.name.trim(), description: createForm.description.trim() }), refreshGroups);
    if (success) setCreateForm(emptyDraft);
  };

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGroup) return;
    let updatedGroup: AdministrationGroup | null = null;
    const success = await runAction("update-group-" + selectedGroup.id, "Groupe mis à jour.", async () => {
      updatedGroup = await administrationApi.updateGroup(selectedGroup.id, { name: editForm.name.trim(), description: editForm.description.trim() });
    }, refreshGroups);
    if (success && updatedGroup) {
      selectedGroupRef.current = updatedGroup;
      setSelectedGroup(updatedGroup);
      const confirmedGroup = updatedGroup as AdministrationGroup;
      groupDetailSelection.current.selectedId = confirmedGroup.id;
      setEditForm({ name: confirmedGroup.name, description: confirmedGroup.description ?? "" });
    }
  };

  const addMember = (group: AdministrationGroup, user: AdministrationUser) => void runAction(
    "add-group-user-" + user.id, user.first_name + " " + user.last_name + " ajouté au groupe.",
    async () => {
      await administrationApi.addUserToGroup(group.id, user.id);
      if (selectedGroupRef.current === group) {
        groupMembersRevision.current += 1;
        setGroupUsers((users) => users.some((member) => member.id === user.id) ? users : [...users, user]);
      }
    },
    refreshSelectedGroupUsers,
  );

  const owner = selectedGroup ? groupUsers.find((user) => user.id === selectedGroup.owner_id) : null;
  const availableUsers = candidates.options.filter((user) => !groupUsers.some((member) => member.id === user.id));
  const deletionActionKey = deletionTarget
    ? deletionTarget.kind === "member" ? "remove-group-user-" + deletionTarget.user.id : "delete-group-" + deletionTarget.group.id
    : null;

  const confirmDeletion = () => {
    if (!deletionTarget) return;
    if (deletionTarget.kind === "member") {
      const { group, user } = deletionTarget;
      void runAction("remove-group-user-" + user.id, "Utilisateur retiré du groupe.", async () => {
        await administrationApi.removeUserFromGroup(group.id, user.id);
        if (selectedGroupRef.current === group) {
          groupMembersRevision.current += 1;
          setGroupUsers((users) => users.filter((member) => member.id !== user.id));
        }
      }, refreshSelectedGroupUsers).then((success) => { if (success) setDeletionTarget(null); });
      return;
    }
    const { group } = deletionTarget;
    void runAction("delete-group-" + group.id, "Groupe supprimé.", async () => {
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
        setEditForm(emptyDraft);
        setMemberSearch("");
      }
    }, refreshGroups).then((success) => { if (success) setDeletionTarget(null); });
  };

  return (
    <fieldset disabled={busyAction !== null} aria-busy={busyAction !== null} className="min-w-0 grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
      <div className="space-y-5">
        <Panel title="Groupes" description="Sélectionnez un groupe pour modifier ses informations et ses membres."
          action={<RefreshButton label="Actualiser" variant="outline" tone="neutral" loading={busyAction === "refresh-groups"} onClick={() => void runAction("refresh-groups", "Groupes actualisés.", refreshGroups)} />}>
          <GroupsList groups={groups} loading={loading} selectedId={selectedGroup?.id ?? null} onOpen={(groupId) => void loadGroup(groupId)} />
        </Panel>
        <Panel title="Créer un groupe" description="Ajoutez un groupe pour organiser les utilisateurs.">
          <GroupCreateForm form={createForm} saving={busyAction === "create-group"} onChange={setCreateForm} onSubmit={handleCreate} />
        </Panel>
      </div>

      <Panel title={selectedGroup ? selectedGroup.name : "Détail du groupe"}
        description={selectedGroup ? "Modifiez le groupe et gérez ses membres par nom et prénom." : "Sélectionnez un groupe pour ouvrir sa fiche."}
        className="h-fit">
        {groupDetailLoading ? <DataState state="loading" size="s" title="Chargement du groupe…" />
          : groupDetailError ? <ErrorAlert size="s" title={groupDetailError} role="status" />
          : !selectedGroup ? <DataState state="empty" size="s" title="Cliquez sur un groupe dans la liste." description={null} />
          : (
            <div className="space-y-6">
              <GroupEditForm form={editForm} saving={busyAction === "update-group-" + selectedGroup.id} onChange={setEditForm} onSubmit={handleUpdate}
                ownerLabel={owner ? owner.first_name + " " + owner.last_name : "utilisateur #" + selectedGroup.owner_id} />
              <GroupMembers members={groupUsers} busyAction={busyAction}
                onRefresh={() => void runAction("refresh-group-users", "Membres actualisés.", refreshSelectedGroupUsers)}
                onRemove={(user) => setDeletionTarget({ kind: "member", group: selectedGroup, user })} />
              <GroupMemberSearch search={memberSearch} onSearch={setMemberSearch} candidates={availableUsers} loading={candidates.loading} error={candidates.error} busyAction={busyAction} onAdd={(user) => addMember(selectedGroup, user)} />
              <div className="border-t border-[var(--mairie-border)] pt-5">
                <DeleteButton label="Supprimer ce groupe" variant="outline" fullWidth loading={busyAction === "delete-group-" + selectedGroup.id} onClick={() => setDeletionTarget({ kind: "group", group: selectedGroup })} />
              </div>
            </div>
          )}
      </Panel>

      <ConfirmModal
        open={deletionTarget !== null}
        title={deletionTarget?.kind === "member" ? "Retirer ce membre du groupe ?" : "Supprimer ce groupe ?"}
        description={deletionTarget?.kind === "member"
          ? `« ${deletionTarget.user.first_name} ${deletionTarget.user.last_name} » sera retiré du groupe « ${deletionTarget.group.name} ». Son compte ne sera pas supprimé.`
          : deletionTarget ? `Le groupe « ${deletionTarget.group.name} » et ses associations seront définitivement supprimés. Cette action est irréversible.` : ""}
        confirmLabel={deletionTarget?.kind === "member" ? "Retirer du groupe" : "Supprimer le groupe"}
        busy={deletionActionKey !== null && busyAction === deletionActionKey}
        onCancel={() => setDeletionTarget(null)}
        onConfirm={confirmDeletion}
      />
    </fieldset>
  );
}
