import { normalizeDisplayRole } from "@mairie360/lib-components/shared";

export const APP_ROLES = [
  "Admin",
  "Responsable",
  "Maire",
  "User",
  "Guest",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AuthSessionUser = {
  name: string;
  email?: string;
  role?: string;
  service?: string;
  phone?: string;
  status?: string;
  avatar?: string;
  avatarUrl?: string;
  position?: string;
  address?: string;
  city?: string;
  lastConnection?: string;
};

export type AuthSession = {
  user: AuthSessionUser & { role: AppRole };
  groups: string[];
  roles: AppRole[];
  role: AppRole;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

export const EMPTY_SESSION_USER: AuthSessionUser = { name: "" };

/** One shared alias table; the BFF still owns business permissions. */
export function normalizeAppRole(value: unknown): AppRole | null {
  return normalizeDisplayRole(value) ?? null;
}

export function resolveAppRoles(roles: Array<{ name?: unknown } | string>): AppRole[] {
  const normalizedRoles = new Set(
    roles
      .map((role) => normalizeAppRole(typeof role === "string" ? role : role.name))
      .filter((role): role is AppRole => role !== null),
  );

  const resolvedRoles = APP_ROLES.filter((role) => normalizedRoles.has(role));

  return resolvedRoles.length ? resolvedRoles : ["Guest"];
}


export class InvalidSessionResponseError extends Error {
  constructor() { super("Les informations du profil reçues sont incohérentes."); this.name = "InvalidSessionResponseError"; }
}

type RecordValue = Record<string, unknown>;
function record(value: unknown): RecordValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InvalidSessionResponseError();
  return value as RecordValue;
}
const finite = (value: unknown) => typeof value === "number" && Number.isFinite(value);
export function parseAuthSession(value: unknown): AuthSession {
  const body = record(value), user = record(body.user);
  if (!["first_name", "last_name", "email", "status"].every(key => typeof user[key] === "string") ||
      !Array.isArray(body.groups) || !Array.isArray(body.roles) ||
      (user.role !== undefined && typeof user.role !== "string") ||
      (user.id !== undefined && typeof user.id !== "string" && !finite(user.id)) ||
      ["phone", "phone_country"].some(key => user[key] !== undefined && user[key] !== null && typeof user[key] !== "string")) throw new InvalidSessionResponseError();
  const groups = body.groups.map(item => {
    const group = record(item);
    if (typeof group.name !== "string" || !finite(group.id) || !finite(group.owner_id) ||
        (group.description !== undefined && group.description !== null && typeof group.description !== "string")) throw new InvalidSessionResponseError();
    return group.name.trim();
  }).filter(Boolean);
  const responseRoles = body.roles.map(item => {
    if (typeof item === "string") return item;
    const role = record(item);
    if (typeof role.name !== "string" || (role.id !== undefined && !finite(role.id))) throw new InvalidSessionResponseError();
    return role.name;
  });
  const roles = resolveAppRoles(typeof user.role === "string" && user.role.trim() ? [user.role] : responseRoles);
  const role = roles[0];
  const name = `${(user.first_name as string).trim()} ${(user.last_name as string).trim()}`.trim();
  const email = (user.email as string).trim();
  return {
    user: { name: name || email, email: email || undefined, phone: typeof user.phone === "string" ? user.phone.trim() || undefined : undefined,
      status: (user.status as string).trim() || undefined, service: groups.length ? groups.join(", ") : undefined,
      position: undefined, address: undefined, city: undefined, lastConnection: undefined, role },
    groups, roles, role, isAdmin: role === "Admin", loading: false, error: null,
  };
}
