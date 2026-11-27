import { ShieldCheck, UserCog, UsersRound } from "lucide-react";

// The « Sessions » tab is gone, a user's sessions live in their record. The « Services » and « Sécurité »
// tabs were removed from the console: three sections, each with its count.
export type AdministrationTabId = "users" | "roles" | "groups";

export const administrationTabs = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "roles", label: "Rôles", icon: ShieldCheck },
  { id: "groups", label: "Groupes", icon: UsersRound },
] as const satisfies ReadonlyArray<{ id: AdministrationTabId; label: string; icon: typeof UserCog }>;

/** Count of each tab; `undefined` (or `null`) until a successful read, so no count is shown. */
export type AdministrationTabCounts = Partial<Record<AdministrationTabId, number | null | undefined>>;

export interface ConsoleMetric {
  tab: AdministrationTabId;
  label: string;
  value: number | string;
  caption: string;
  icon: typeof UserCog;
  /** The caption reads as a rising figure (« ↗ 12 actifs »). */
  trend?: "up";
}

/** Caption of a counter whose figure is read separately: « — » until it is known. */
const counted = (value: number | null | undefined, unit: string) => `${value ?? "—"} ${unit}`;

/**
 * The three counters; « — » until a successful read. The groups caption names the teams: the BFF gives
 * no member count per group, so the number of assignments cannot be shown.
 */
export const consoleMetrics = (counts: { users: number | null; activeUsers?: number | null; roles?: number; groups?: number }): ConsoleMetric[] => [
  { tab: "users", label: "Utilisateurs", value: counts.users ?? "—", caption: counted(counts.activeUsers, "actifs"), icon: UserCog, trend: "up" },
  { tab: "roles", label: "Rôles", value: counts.roles ?? "—", caption: "Modèles d’accès", icon: ShieldCheck },
  { tab: "groups", label: "Groupes", value: counts.groups ?? "—", caption: "Équipes de la mairie", icon: UsersRound },
];
