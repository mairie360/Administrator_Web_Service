"use client";
import { Trash2 } from "lucide-react";
import { DataState, PanelTitle, RefreshButton } from "@mairie360/lib-components/primitives";

import type { AdministrationGroupMember } from "@/lib/administration-api";
import { ActionButton } from "../shared/controls";
import { memberIdentity } from "./MemberIdentity";

/** The members of the selected group, each removable after confirmation. */
export const GroupMembers = ({ members, busyAction, onRefresh, onRemove }: { members: AdministrationGroupMember[]; busyAction: string | null; onRefresh: () => void; onRemove: (member: AdministrationGroupMember) => void }) => (
  <div className="border-t border-[var(--mairie-border)] pt-5">
    <div className="mb-3 flex items-center justify-between gap-3">
      <PanelTitle>Membres ({members.length})</PanelTitle>
      <RefreshButton label="Actualiser" variant="ghost" tone="neutral" loading={busyAction === "refresh-group-users"} onClick={onRefresh} />
    </div>
    {members.length === 0 ? <DataState state="empty" size="s" title="Ce groupe ne contient aucun utilisateur." description={null} /> : (
      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--mairie-border)] px-3 py-2.5">
            {memberIdentity({ firstName: member.first_name, lastName: member.last_name, email: member.email })}
            <ActionButton variant="ghost" size="s" className="shrink-0 !text-[var(--mairie-error-text)]" icon={Trash2} busy={busyAction === "remove-group-user-" + member.id} onClick={() => onRemove(member)}>Retirer</ActionButton>
          </div>
        ))}
      </div>
    )}
  </div>
);
