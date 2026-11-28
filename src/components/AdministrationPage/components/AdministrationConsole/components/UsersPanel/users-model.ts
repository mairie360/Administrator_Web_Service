import { formatDateTime } from "@mairie360/lib-components/primitives";
import { getInstanceTimeZone } from "@mairie360/lib-components/shared";
import type { AccountStatus, AdministrationUser } from '@/lib/administration-api';
import { normalizeAppRole } from '@/lib/auth-session-model';

type Tone = "success" | "info" | "neutral" | "warning";

/** C10 / C13: the states of an account in the colours of the charter (Figma Status/*). */
export const accountStatuses: Record<AccountStatus, { label: string; tone: Tone }> = {
  active: { label: "Actif", tone: "success" },
  invited: { label: "Invité", tone: "info" },
  inactive: { label: "Inactif", tone: "neutral" },
  suspended: { label: "Suspendu", tone: "warning" },
};

export const accountStatusOptions = (Object.keys(accountStatuses) as AccountStatus[]).map((value) => ({ value, label: accountStatuses[value].label }));

export const fullName = (user: Pick<AdministrationUser, "first_name" | "last_name">) => `${user.first_name} ${user.last_name}`.trim();

export const roleName = (user: Pick<AdministrationUser, "roles">) => user.roles[0]?.name ?? "Aucun rôle";

/** The shown role is the administrator one (« Admin », « Administrateur »…), highlighted in the list. */
export const isAdministrator = (user: Pick<AdministrationUser, "roles">) => normalizeAppRole(user.roles[0]?.name) === "Admin";

/** C6: « En ligne · N sessions » while the user has an open session. */
export const onlineLabel = (sessions: number) => `En ligne · ${sessions} session${sessions > 1 ? "s" : ""}`;

/**
 * « Dernière connexion » when the user is not online: the date, or « Jamais ». MAIR-1259: the list shows the day
 * alone (« 2 juil. 2026 », artifact); the user record keeps the time (`withTime`).
 */
export const lastLoginLabel = (user: Pick<AdministrationUser, "last_login_at">, withTime = false) => {
  if (!user.last_login_at) return "Jamais";
  if (withTime) return formatDateTime(user.last_login_at, "medium") ?? "Jamais";
  const date = new Date(user.last_login_at);
  if (Number.isNaN(date.getTime())) return "Jamais";
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: getInstanceTimeZone() }).format(date);
};
