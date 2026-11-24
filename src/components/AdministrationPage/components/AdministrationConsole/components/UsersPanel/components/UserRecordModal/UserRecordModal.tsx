"use client";
import { CheckCircle2, Lock, Pencil, Trash2 } from "lucide-react";
import { Button, DescriptionList, Modal, StatusPill, Tag, UserIdentity } from "@mairie360/lib-components/primitives";

import type { AdministrationUser } from '@/lib/administration-api';
import { accountStatuses, fullName, lastLoginLabel, onlineLabel, roleName } from '../../users-model';
import { UserSessions } from './components/UserSessions';

export interface UserRecordModalProps {
  user: AdministrationUser | null;
  /** The signed-in administrator: their own account can be neither suspended nor deleted. */
  currentUserId: number | null;
  locked: boolean;
  onClose: () => void;
  onEdit: (user: AdministrationUser) => void;
  onToggleSuspension: (user: AdministrationUser) => void;
  onDelete: (user: AdministrationUser) => void;
  onRevoke: (action: () => Promise<void>, successMessage: string) => Promise<boolean>;
  onActiveCountChange: (userId: number, count: number) => void;
}

/**
 * C4: the user record, a centred 800 px modal (`Modal` size l): identity, role, state, phone, last sign-in,
 * the actions Modifier, Suspendre / Réactiver and Supprimer (the only red one, C12), then the sessions (C5).
 * Closed by Échap, ✕ or the backdrop; the lib gives the focus back to the row that opened it.
 */
export function UserRecordModal({ user, currentUserId, locked, onClose, onEdit, onToggleSuspension, onDelete, onRevoke, onActiveCountChange }: UserRecordModalProps) {
  if (!user) return null;
  const name = fullName(user);
  const state = accountStatuses[user.account_status];
  const own = user.id === currentUserId;
  const suspended = user.account_status === "suspended";
  const archived = user.account_status === "inactive";
  return (
    <Modal open title="Fiche utilisateur" size="l" onClose={onClose} closeLabel="Fermer la fiche">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="min-w-[200px] flex-1 space-y-2">
            <UserIdentity name={name} email={user.email} size="m" />
            <div className="flex flex-wrap gap-2">
              <Tag label={roleName(user)} size="s" />
              <StatusPill label={state.label} tone={state.tone} dot size="s" data-status={user.account_status} />
              {user.active_sessions > 0 && <StatusPill label={onlineLabel(user.active_sessions)} tone="success" dot size="s" />}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" tone="neutral" size="s" icon={Pencil} disabled={locked} onClick={() => onEdit(user)}>Modifier</Button>
            {!own && !archived && (
              <Button variant="outline" tone="neutral" size="s" icon={suspended ? CheckCircle2 : Lock} disabled={locked} onClick={() => onToggleSuspension(user)}>
                {suspended ? "Réactiver" : "Suspendre"}
              </Button>
            )}
            {!own && !archived && <Button variant="solid" tone="danger" size="s" icon={Trash2} disabled={locked} onClick={() => onDelete(user)}>Supprimer</Button>}
          </div>
        </div>
        <DescriptionList items={[
          { label: "Rôle", value: roleName(user) },
          { label: "Statut", value: state.label },
          { label: "Téléphone", value: user.phone_number || "Aucun téléphone" },
          { label: "Dernière connexion", value: user.active_sessions > 0 ? "En ligne" : lastLoginLabel(user) },
        ]} />
        <UserSessions key={`${user.id}-${user.account_status}`} userId={user.id} name={name} status={user.account_status} locked={locked}
          onRevoke={onRevoke} onActiveCountChange={(count) => onActiveCountChange(user.id, count)} />
      </div>
    </Modal>
  );
}
