import { KeyRound, ShieldCheck, UserCog, UsersRound } from "lucide-react";

// MAIR-885 C1: the « Sessions » tab is gone, a user's sessions live in their record (MAIR-894).
// MAIR-824: « Sécurité » after them, the second factor of the mairie (Administrator part of MAIR-809).
export type AdministrationTabId = "users" | "roles" | "groups" | "security";

export const administrationTabs = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "roles", label: "Rôles", icon: ShieldCheck },
  { id: "groups", label: "Groupes", icon: UsersRound },
  { id: "security", label: "Sécurité", icon: KeyRound },
] as const satisfies ReadonlyArray<{ id: AdministrationTabId; label: string; icon: typeof UserCog }>;

export interface ConsoleMetric { tab: AdministrationTabId; label: string; value: number | string; caption: string; icon: typeof UserCog }

/** C2: the three counters; « — » until a successful read. */
export const consoleMetrics = (counts: { users: number | null; roles?: number; groups?: number }): ConsoleMetric[] => [
  { tab: "users", label: "Utilisateurs", value: counts.users ?? "—", caption: "Comptes des agents", icon: UserCog },
  { tab: "roles", label: "Rôles", value: counts.roles ?? "—", caption: "Modèles d’accès", icon: ShieldCheck },
  { tab: "groups", label: "Groupes", value: counts.groups ?? "—", caption: "Services et équipes", icon: UsersRound },
];
