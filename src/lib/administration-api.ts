import type {
  AdministrationGroup,
  AdministrationGroupMember,
  AdministrationRole,
  AdministrationSession,
  AdministrationUser,
  AdministrationUsersPage,
} from "@mairie360/bff-user-openapi/model";
import type { GetAdminUsersParams } from "@mairie360/bff-user-openapi/model";
import { parseUsersPage, parseRoles, parseGroups, parseSessions } from "./administration-response";
import { bffUser } from "./bff-client";

// Modèles du contrat publié de BFF User (@mairie360/bff-user-openapi, version exacte de package.json).
export type {
  AdministrationGroup,
  AdministrationGroupMember,
  AdministrationRole,
  AdministrationSession,
  AdministrationUser,
  AdministrationUsersPage,
};

export type AdministrationUserRole = Pick<AdministrationRole, "id" | "name">;

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
};

export type RolePatchInput = Partial<RoleInput>;

export type GroupInput = {
  name: string;
  description: string;
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

export function createAdministrationApi(client: typeof bffUser = bffUser) {
  return {
    async listUsers({ page = 1, search = "" }: { page?: number; search?: string } = {}, signal?: AbortSignal) {
      const query: GetAdminUsersParams = {
        page: positiveInteger(page, "La page"),
        page_size: 20,
      };
      const trimmedSearch = search.trim();
      if (trimmedSearch) {
        query.search = boundedText(trimmedSearch, "La recherche", { max: SEARCH_MAX_LENGTH });
      }

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

    createUser(input: CreateUserInput) {
      return done(client.postAdminUsers(input));
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
