import { Activity, MonitorSmartphone, ShieldCheck, UserCog, UsersRound } from "lucide-react";

export type AdministrationTabId = "users" | "roles" | "groups" | "sessions";

export const administrationTabs = [
  { id: "users", label: "Utilisateurs", icon: UserCog },
  { id: "roles", label: "Rôles", icon: ShieldCheck },
  { id: "groups", label: "Groupes", icon: UsersRound },
  { id: "sessions", label: "Sessions", icon: MonitorSmartphone },
] as const satisfies ReadonlyArray<{ id: AdministrationTabId; label: string; icon: typeof UserCog }>;

export interface ConsoleMetric { tab: AdministrationTabId; label: string; value: number | string; icon: typeof UserCog }

/** The four counters; « — » until a successful read. */
export const consoleMetrics = (counts: { users: number | null; roles?: number; groups?: number; sessions?: number }): ConsoleMetric[] => [
  { tab: "users", label: "Utilisateurs", value: counts.users ?? "—", icon: UserCog },
  { tab: "roles", label: "Rôles", value: counts.roles ?? "—", icon: ShieldCheck },
  { tab: "groups", label: "Groupes", value: counts.groups ?? "—", icon: UsersRound },
  { tab: "sessions", label: "Sessions actives", value: counts.sessions ?? "—", icon: Activity },
];
