"use client";
import { Pencil } from "lucide-react";
import { Icon, statuses } from "@mairie360/lib-components/primitives";

import type { AdministrationUser } from "@/lib/administration-api";

const pillClass = "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold";
const toneClass = { success: "bg-[var(--mairie-success-surface)] text-[var(--mairie-success-text)]", neutral: "bg-[var(--mairie-surface-raised)] text-[var(--mairie-text)]", primary: "bg-[var(--mairie-accent-surface)] text-[var(--mairie-accent)]" } as const;

/**
 * Status of an account in the colour of the shared statuses (Figma Status/Active, Status/Inactive):
 * archived accounts read « Archivé », others show the BFF status. Native text keeps the row's content searchable.
 */
export const userStatus = (user: AdministrationUser) => {
  const tone = (user.is_archived ? statuses.inactive : statuses.active).tone as keyof typeof toneClass;
  return <span data-status={user.is_archived ? "inactive" : "active"} className={`${pillClass} ${toneClass[tone]}`}>{user.is_archived ? "Archivé" : user.status}</span>;
};

/** One user of the table; selecting it (click, Enter, Space) opens the editor. */
export const UserRow = ({ user, selected, locked, onSelect }: { user: AdministrationUser; selected: boolean; locked: boolean; onSelect: (user: AdministrationUser) => void }) => (
  <tr tabIndex={locked ? -1 : 0} aria-disabled={locked} aria-selected={selected} onClick={() => onSelect(user)}
    onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelect(user); } }}
    className={"cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[var(--mairie-accent)]/30 " + (selected ? "bg-[var(--mairie-accent-surface)]" : "bg-[var(--mairie-surface)] hover:bg-[var(--mairie-surface-raised)]")}>
    {/* Native text inside the selectable row keeps its accessible name and search-by-text intact. */}
    <td className="px-4 py-3.5">
      <div className="font-bold text-[var(--mairie-text)]">{user.first_name} {user.last_name}</div>
      <div className="mt-0.5 text-xs text-[var(--mairie-muted)]">Identifiant #{user.id}</div>
    </td>
    <td className="px-4 py-3.5">
      <div className="text-[var(--mairie-text)]">{user.email}</div>
      <div className="mt-0.5 text-xs text-[var(--mairie-muted)]">{user.phone_number || "Aucun téléphone"}</div>
    </td>
    <td className="px-4 py-3.5"><span className={`${pillClass} ${toneClass.primary}`}>{user.roles.map((role) => role.name).join(", ") || "Aucun rôle"}</span></td>
    <td className="px-4 py-3.5">{userStatus(user)}</td>
    <td className="px-4 py-3.5 text-right"><Icon icon={Pencil} size="s" className="text-[var(--mairie-muted)]" /></td>
  </tr>
);
