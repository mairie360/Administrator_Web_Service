import type {
  AdministrationGroup,
  AdministrationGroupMember,
  AdministrationRole,
  AdministrationService,
  AdministrationSession,
  AdministrationUser,
  AdministrationUsersPage,
} from "@mairie360/bff-user-openapi/model";
import type { GetAdminUsersParams } from "@mairie360/bff-user-openapi/model";
import { parseUsersPage, parseRoles, parseGroups, parseService, parseServices, parseSessions, type GROUP_COLORS, type ROLE_MODULES } from "./administration-response";
import { bffUser } from "./bff-client";

// Modèles du contrat publié de BFF User (@mairie360/bff-user-openapi, version exacte de package.json).
export type {
  AdministrationGroup,
  AdministrationGroupMember,
  AdministrationRole,
  AdministrationService,
  AdministrationSession,
  AdministrationUser,
  AdministrationUsersPage,
};
export { GROUP_COLORS, ROLE_MODULES } from "./administration-response";
/** MAIR-916: a module of the shared navigation a role opens. */
export type RoleModule = (typeof ROLE_MODULES)[number];
/** Names of the modules of the shared navigation (MAIR-916), in its order. */
export const MODULE_LABELS: Record<RoleModule, string> = {
  dashboard: "Tableau de bord", projects: "Projets", calendar: "Calendrier", messages: "Messagerie",
  training: "Formation", admin: "Administration", settings: "Paramètres",
};
/** MAIR-923: a colour of the charter palette for a group card. */
export type GroupColor = (typeof GROUP_COLORS)[number];

export type AdministrationUserRole = Pick<AdministrationRole, "id" | "name">;

/** States of an account in the V2 list (MAIR-904), as Core computes them. */
export type AccountStatus = "active" | "invited" | "inactive" | "suspended";
export type UsersSort = "name" | "-name";

/** One page of the V2 users list: 6 rows (MAIR-904), with its filters and order. */
export interface UsersQuery {
  page?: number;
  search?: string;
  status?: AccountStatus | "";
  roleId?: number | null;
  sort?: UsersSort;
  pageSize?: number;
}

/** MAIR-808: the second-factor policy of the instance (« Sécurité » tab, A1). */
export interface TwoFactorPolicy { required: boolean; totp_allowed: boolean; passkey_allowed: boolean; backup_codes_allowed: boolean }

/** F21 (MAIR-683): a project of BFF_Project left without a group. */
export interface ProjectWithoutGroup { id: string; title: string; createdAt: string | null }

/** Rows of the V2 list (MAIR-904). */
export const USERS_PAGE_SIZE = 6;

export type CreateUserInput = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone_number?: string | null;
};

export type UpdateUserInput = Partial<
  Omit<CreateUserInput, "password">
>;

export type RoleInput = {
  name: string;
  description: string;
  can_be_deleted?: boolean | null;
  modules?: RoleModule[];
};

export type RolePatchInput = Partial<RoleInput>;

export type GroupInput = {
  name: string;
  description: string;
  color?: GroupColor | null;
};

// Bornes imposées par le contrat BFF User (AdminUserListQuery, AdminUserPasswordResetBody,
// AdminGroupPatchBody) : vérifiées avant l'appel pour éviter un 400 sans message exploitable.
const SEARCH_MAX_LENGTH = 100;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 255;
const GROUP_NAME_MAX_LENGTH = 64;
const GROUP_DESCRIPTION_MAX_LENGTH = 2000;

/** Awaits a generated operation whose response carries no body. */
async function done(call: Promise<unknown>): Promise<void> {
  await call;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function extractArray(value: unknown, preferredKeys: string[]): unknown[] {
  if (Array.isArray(value)) return value;

  const record = asRecord(value);
  if (!record) return [];

  for (const key of preferredKeys) {
    if (Array.isArray(record[key])) return record[key];
  }

  const firstArray = Object.values(record).find(Array.isArray);
  return firstArray ?? [];
}

function isGroup(value: unknown): value is AdministrationGroup {
  const group = asRecord(value);
  return (
    group !== null &&
    typeof group.id === "number" &&
    typeof group.name === "string" &&
    typeof group.owner_id === "number" &&
    (group.description === undefined ||
      group.description === null ||
      typeof group.description === "string")
  );
}

function isGroupMember(value: unknown): value is AdministrationGroupMember {
  const user = asRecord(value);
  return (
    user !== null &&
    typeof user.id === "number" &&
    typeof user.first_name === "string" &&
    typeof user.last_name === "string" &&
    typeof user.email === "string" &&
    (user.phone_number === undefined ||
      user.phone_number === null ||
      typeof user.phone_number === "string") &&
    typeof user.status === "string" &&
    typeof user.is_archived === "boolean"
  );
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} doit être un entier positif.`);
  }

  return value;
}

function boundedText(value: string, label: string, { min = 0, max }: { min?: number; max: number }) {
  if (value.length < min) {
    throw new Error(
      min === 1 ? `${label} est obligatoire.` : `${label} doit contenir au moins ${min} caractères.`,
    );
  }
  if (value.length > max) {
    throw new Error(`${label} ne doit pas dépasser ${max} caractères.`);
  }

  return value;
}

/** The policy fields of a BFF answer; anything else is an incoherent answer. */
export function parseTwoFactorPolicy(value: unknown): TwoFactorPolicy {
  const record = asRecord(value);
  const keys = ["required", "totp_allowed", "passkey_allowed", "backup_codes_allowed"] as const;
  if (!record || keys.some((key) => typeof record[key] !== "boolean")) throw new Error("La politique de double authentification reçue est incohérente.");
  return { required: record.required as boolean, totp_allowed: record.totp_allowed as boolean, passkey_allowed: record.passkey_allowed as boolean, backup_codes_allowed: record.backup_codes_allowed as boolean };
}

export function createAdministrationApi(client: typeof bffUser = bffUser) {
  return {
    async listUsers({ page = 1, search = "", status = "", roleId = null, sort = "name", pageSize = USERS_PAGE_SIZE }: UsersQuery = {}, signal?: AbortSignal) {
      const query: GetAdminUsersParams = {
        page: positiveInteger(page, "La page"),
        page_size: positiveInteger(pageSize, "La taille de page"),
      };
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        query.search = boundedText(trimmedSearch, "La recherche", { max: SEARCH_MAX_LENGTH });
      }
      if (status) query.account_status = status;
      if (roleId) query.role_id = positiveInteger(roleId, "L’identifiant du rôle");
      if (sort === "-name") query.sort = sort;

      const { data: response } = await client.getAdminUsers(query, { signal });
      return parseUsersPage(response);
    },

    async listRoles() {
      const { data: response } = await client.getAdminRoles();
      return parseRoles(response);
    },

    createRole(input: RoleInput) {
      return done(client.postAdminRoles(input));
    },

    replaceRole(roleId: number, input: RoleInput) {
      return done(client.putAdminRolesRoleId(positiveInteger(roleId, "L’identifiant du rôle"), input));
    },

    updateRole(roleId: number, input: RolePatchInput) {
      return done(client.patchAdminRolesRoleId(positiveInteger(roleId, "L’identifiant du rôle"), input));
    },

    deleteRole(roleId: number) {
      return done(client.deleteAdminRolesRoleId(positiveInteger(roleId, "L’identifiant du rôle")));
    },

    async listGroups() {
      const { data: response } = await client.getAdminGroups();
      return parseGroups(response);
    },

    async getGroup(groupId: number) {
      const { data: response } = await client.getAdminGroupsGroupId(positiveInteger(groupId, "L’identifiant du groupe"));
      const record = asRecord(response);
      const group = record?.group ?? response;
      return isGroup(group) ? group : null;
    },

    createGroup(input: GroupInput) {
      return done(client.postAdminGroups(input));
    },

    async updateGroup(groupId: number, input: GroupInput) {
      const resolvedGroupId = positiveInteger(groupId, "L’identifiant du groupe");
      boundedText(input.name, "Le nom du groupe", { min: 1, max: GROUP_NAME_MAX_LENGTH });
      boundedText(input.description, "La description du groupe", { max: GROUP_DESCRIPTION_MAX_LENGTH });
      const { data: response } = await client.patchAdminGroupsGroupId(resolvedGroupId, input);
      const record = asRecord(response);
      const group = record?.group ?? response;
      return isGroup(group) ? group : null;
    },

    deleteGroup(groupId: number) {
      return done(client.deleteAdminGroupsGroupId(positiveInteger(groupId, "L’identifiant du groupe")));
    },

    async listGroupUsers(groupId: number) {
      const { data: response } = await client.getAdminGroupsGroupIdUsers(positiveInteger(groupId, "L’identifiant du groupe"));
      return extractArray(response, ["users"]).filter(isGroupMember);
    },

    addUserToGroup(groupId: number, userId: number) {
      const resolvedGroupId = positiveInteger(groupId, "L’identifiant du groupe");
      const resolvedUserId = positiveInteger(userId, "L’identifiant utilisateur");
      return done(client.postAdminGroupsGroupIdUsers(resolvedGroupId, {
        group_id: resolvedGroupId,
        user_id: resolvedUserId,
      }));
    },

    removeUserFromGroup(groupId: number, userId: number) {
      return done(client.deleteAdminGroupsGroupIdUsersUserId(
        positiveInteger(groupId, "L’identifiant du groupe"),
        positiveInteger(userId, "L’identifiant utilisateur"),
      ));
    },

    /** Creates the account and answers its id (`null` when the BFF does not send it back). */
    async createUser(input: CreateUserInput): Promise<number | null> {
      const { data } = await client.postAdminUsers(input);
      const id = asRecord(data)?.id;
      return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
    },

    updateUser(userId: number, input: UpdateUserInput) {
      return done(client.patchAdminUsersUserId(positiveInteger(userId, "L’identifiant utilisateur"), input));
    },

    resetUserPassword(userId: number, newPassword: string) {
      const resolvedUserId = positiveInteger(userId, "L’identifiant utilisateur");
      boundedText(newPassword, "Le mot de passe", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH });
      return done(client.patchAdminUsersUserIdPassword(resolvedUserId, { new_password: newPassword }));
    },

    deleteUser(userId: number) {
      return done(client.deleteAdminUsersUserId(positiveInteger(userId, "L’identifiant utilisateur")));
    },

    addRoleToUser(userId: number, roleId: number) {
      const resolvedUserId = positiveInteger(userId, "L’identifiant utilisateur");
      const resolvedRoleId = positiveInteger(roleId, "L’identifiant du rôle");
      return done(client.postAdminUsersUserIdRoles(resolvedUserId, {
        user_id: resolvedUserId,
        role_id: resolvedRoleId,
      }));
    },

    removeRoleFromUser(userId: number, roleId: number) {
      return done(client.deleteAdminUsersUserIdRolesRoleId(
        positiveInteger(userId, "L’identifiant utilisateur"),
        positiveInteger(roleId, "L’identifiant du rôle"),
      ));
    },

    /** MAIR-584: the latest sessions of one user, active and ended, newest first. */
    async listUserSessions(userId: number, signal?: AbortSignal) {
      const { data: response } = await client.getAdminUsersUserIdSessions(positiveInteger(userId, "L’identifiant utilisateur"), { signal });
      return parseSessions(response);
    },

    /** MAIR-584: signs the user out of one device. */
    revokeUserSession(userId: number, sessionId: string) {
      return done(client.deleteAdminUsersUserIdSessionsSessionId(positiveInteger(userId, "L’identifiant utilisateur"), sessionId));
    },

    /** MAIR-584: signs the user out of every device. */
    revokeUserSessions(userId: number) {
      return done(client.deleteAdminUsersUserIdSessions(positiveInteger(userId, "L’identifiant utilisateur")));
    },

    /** MAIR-904: suspends the account (every session closed) or reactivates it. */
    suspendUser(userId: number) {
      return done(client.postAdminUsersUserIdSuspend(positiveInteger(userId, "L’identifiant utilisateur")));
    },

    reactivateUser(userId: number) {
      return done(client.postAdminUsersUserIdReactivate(positiveInteger(userId, "L’identifiant utilisateur")));
    },

    /** MAIR-923: the services of the mairie, by name, with their agent counts. */
    async listServices(signal?: AbortSignal) {
      const { data } = await client.getAdminServices({ signal });
      return parseServices(data);
    },

    async createService(name: string) {
      const { data } = await client.postAdminServices({ name: boundedText(name.trim(), "Le nom du service", { min: 1, max: GROUP_NAME_MAX_LENGTH }) });
      return parseService(data);
    },

    async renameService(serviceId: number, name: string) {
      const { data } = await client.patchAdminServicesServiceId(positiveInteger(serviceId, "L’identifiant du service"),
        { name: boundedText(name.trim(), "Le nom du service", { min: 1, max: GROUP_NAME_MAX_LENGTH }) });
      return parseService(data);
    },

    deleteService(serviceId: number) {
      return done(client.deleteAdminServicesServiceId(positiveInteger(serviceId, "L’identifiant du service")));
    },

    /** MAIR-923: attaches the agent to a service, or detaches them with `null`. */
    setUserService(userId: number, serviceId: number | null) {
      return done(client.putAdminUsersUserIdService(positiveInteger(userId, "L’identifiant utilisateur"),
        { service_id: serviceId === null ? null : positiveInteger(serviceId, "L’identifiant du service") }));
    },

    /** F21 (MAIR-683): the projects left without a group, newest first. */
    async listProjectsWithoutGroup(signal?: AbortSignal): Promise<{ total: number; projects: ProjectWithoutGroup[] }> {
      const { data } = await client.getAdminProjectsWithoutGroup({ signal });
      return { total: data.total, projects: data.projects.map(({ id, title, createdAt }) => ({ id, title, createdAt: createdAt ?? null })) };
    },

    /** A1 (MAIR-808): the second-factor policy of the instance. */
    async getTwoFactorPolicy(): Promise<TwoFactorPolicy> {
      const { data } = await client.getAdminTwoFactorPolicy();
      return parseTwoFactorPolicy(data);
    },

    /** A1: replaces the policy (at least one method stays allowed; the passkeys need WebAuthn on Core). */
    async updateTwoFactorPolicy(policy: TwoFactorPolicy): Promise<TwoFactorPolicy> {
      const { data } = await client.putAdminTwoFactorPolicy(policy);
      return parseTwoFactorPolicy(data);
    },

    /** A2 (MAIR-805): removes the second factor of an agent and closes their sessions. */
    resetUserTwoFactor(userId: number) {
      return done(client.deleteAdminUsersUserId2fa(positiveInteger(userId, "L’identifiant utilisateur")));
    },

    async listActiveSessions() {
      const { data: response } = await client.getAdminSessions();
      return parseSessions(response);
    },

    async listSessionHistory() {
      const { data: response } = await client.getAdminSessionsHistory();
      return parseSessions(response);
    },

  };
}

export const administrationApi = createAdministrationApi();
