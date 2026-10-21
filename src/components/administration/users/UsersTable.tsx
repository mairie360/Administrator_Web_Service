"use client";
import type { AdministrationUser } from "@/lib/administration-api";
import { UserRow } from "./UserRow";

/** The users table (Figma DataTable/Users): name, contact, role, status, edit hint. */
export const UsersTable = ({ users, selectedId, locked, onSelect }: { users: AdministrationUser[]; selectedId: number | null; locked: boolean; onSelect: (user: AdministrationUser) => void }) => (
  <div className="overflow-x-auto rounded-lg border border-[var(--mairie-border)]">
    <table className="w-full min-w-[760px] text-left text-sm">
      {/* Column headers in the Overline style (Figma Text/Overline), as native header text. */}
      <thead className="bg-[var(--mairie-surface-raised)] text-xs font-semibold uppercase tracking-wide text-[var(--mairie-muted)]">
        <tr>
          {["Utilisateur", "Contact", "Rôle", "Statut"].map((label) => <th key={label} className="px-4 py-3">{label}</th>)}
          <th className="relative w-12 px-4 py-3">
            <span className="sr-only">Modifier</span>
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[var(--mairie-border)]">
        {users.map((user) => <UserRow key={user.id} user={user} selected={selectedId === user.id} locked={locked} onSelect={onSelect} />)}
      </tbody>
    </table>
  </div>
);
