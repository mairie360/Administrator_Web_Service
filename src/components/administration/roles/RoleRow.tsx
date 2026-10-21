"use client";
import { DeleteButton, EditButton, Help, StatusPill, Text } from "@mairie360/lib-components/primitives";

import type { AdministrationRole } from "@/lib/administration-api";

/** One role of the list: name, id pill, description, edit and delete actions. */
export const RoleRow = ({ role, deleting, onEdit, onDelete }: { role: AdministrationRole; deleting: boolean; onEdit: (role: AdministrationRole) => void; onDelete: (role: AdministrationRole) => void }) => (
  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" data-role-id={role.id}>
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <Text weight="bold">{role.name}</Text>
        <StatusPill label={`#${role.id}`} size="xs" className="font-mono" />
      </div>
      <Help className="mt-1">{role.description}</Help>
    </div>
    <div className="flex shrink-0 gap-2">
      <EditButton label="Modifier" variant="outline" tone="neutral" onClick={() => onEdit(role)} />
      <DeleteButton label="Supprimer" loading={deleting} onClick={() => onDelete(role)} />
    </div>
  </div>
);
