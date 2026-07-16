import { requestBff } from "./bff-client";

export type AdministrationRole = {
  id: number;
  name: string;
  description: string;
};

export type AdministrationGroup = {
  id: number;
  name: string;
  description?: string | null;
  owner_id: number;
};

export type AdministrationSession = {
  id: string;
  device_info: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
};

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

const ADMIN_BASE_PATH = "/bff/admin";

function requestAdmin<T>(path: string, init: RequestInit = {}) {
  return requestBff<T>(`${ADMIN_BASE_PATH}${path}`, init);
}

function jsonRequest(method: string, body: unknown): RequestInit {
  return {
    method,
    body: JSON.stringify(body),
  };
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

function isRole(value: unknown): value is AdministrationRole {
  const role = asRecord(value);
  return (
    role !== null &&
    typeof role.id === "number" &&
    typeof role.name === "string" &&
    typeof role.description === "string"
  );
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

function isSession(value: unknown): value is AdministrationSession {
  const session = asRecord(value);
  return (
    session !== null &&
    typeof session.id === "string" &&
    typeof session.device_info === "string" &&
    typeof session.ip_address === "string" &&
    typeof session.created_at === "string" &&
    typeof session.expires_at === "string" &&
    (session.revoked_at === undefined ||
      session.revoked_at === null ||
      typeof session.revoked_at === "string")
  );
}

function positiveInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} doit être un entier positif.`);
  }

  return value;
}

export const administrationApi = {
  async listRoles() {
    const response = await requestAdmin<unknown>("/roles");
    return extractArray(response, ["roles"]).filter(isRole);
  },

  createRole(input: RoleInput) {
    return requestAdmin<void>("/roles", jsonRequest("POST", input));
  },

  replaceRole(roleId: number, input: RoleInput) {
    return requestAdmin<void>(
      `/roles/${positiveInteger(roleId, "L’identifiant du rôle")}`,
      jsonRequest("PUT", input),
    );
  },

  updateRole(roleId: number, input: RolePatchInput) {
    return requestAdmin<void>(
      `/roles/${positiveInteger(roleId, "L’identifiant du rôle")}`,
      jsonRequest("PATCH", input),
    );
  },

  deleteRole(roleId: number) {
    return requestAdmin<void>(
      `/roles/${positiveInteger(roleId, "L’identifiant du rôle")}`,
      { method: "DELETE" },
    );
  },

  async listGroups() {
    const response = await requestAdmin<unknown>("/groups");
    return extractArray(response, ["groups"]).filter(isGroup);
  },

  async getGroup(groupId: number) {
    const response = await requestAdmin<unknown>(
      `/groups/${positiveInteger(groupId, "L’identifiant du groupe")}`,
    );
    const record = asRecord(response);
    const group = record?.group ?? response;
    return isGroup(group) ? group : null;
  },

  createGroup(input: GroupInput) {
    return requestAdmin<void>("/groups", jsonRequest("POST", input));
  },

  deleteGroup(groupId: number) {
    return requestAdmin<void>(
      `/groups/${positiveInteger(groupId, "L’identifiant du groupe")}`,
      { method: "DELETE" },
    );
  },

  async listGroupUsers(groupId: number) {
    const response = await requestAdmin<unknown>(
      `/groups/${positiveInteger(groupId, "L’identifiant du groupe")}/users`,
    );
    return extractArray(response, ["users"]).filter(
      (userId): userId is number => Number.isInteger(userId) && Number(userId) > 0,
    );
  },

  addUserToGroup(groupId: number, userId: number) {
    const resolvedGroupId = positiveInteger(groupId, "L’identifiant du groupe");
    const resolvedUserId = positiveInteger(userId, "L’identifiant utilisateur");
    return requestAdmin<void>(
      `/groups/${resolvedGroupId}/users`,
      jsonRequest("POST", {
        group_id: resolvedGroupId,
        user_id: resolvedUserId,
      }),
    );
  },

  removeUserFromGroup(groupId: number, userId: number) {
    return requestAdmin<void>(
      `/groups/${positiveInteger(groupId, "L’identifiant du groupe")}/users/${positiveInteger(userId, "L’identifiant utilisateur")}`,
      { method: "DELETE" },
    );
  },

  createUser(input: CreateUserInput) {
    return requestAdmin<void>("/users", jsonRequest("POST", input));
  },

  updateUser(userId: number, input: UpdateUserInput) {
    return requestAdmin<void>(
      `/users/${positiveInteger(userId, "L’identifiant utilisateur")}`,
      jsonRequest("PATCH", input),
    );
  },

  addRoleToUser(userId: number, roleId: number) {
    const resolvedUserId = positiveInteger(userId, "L’identifiant utilisateur");
    const resolvedRoleId = positiveInteger(roleId, "L’identifiant du rôle");
    return requestAdmin<void>(
      `/users/${resolvedUserId}/roles`,
      jsonRequest("POST", {
        user_id: resolvedUserId,
        role_id: resolvedRoleId,
      }),
    );
  },

  removeRoleFromUser(userId: number, roleId: number) {
    return requestAdmin<void>(
      `/users/${positiveInteger(userId, "L’identifiant utilisateur")}/roles/${positiveInteger(roleId, "L’identifiant du rôle")}`,
      { method: "DELETE" },
    );
  },

  async listActiveSessions() {
    const response = await requestAdmin<unknown>("/sessions");
    return extractArray(response, ["sessions"]).filter(isSession);
  },

  async listSessionHistory() {
    const response = await requestAdmin<unknown>("/sessions/history");
    return extractArray(response, ["sessions"]).filter(isSession);
  },

  refreshSession(refreshToken: string) {
    return requestAdmin<void>(
      "/sessions/refresh",
      jsonRequest("POST", { refresh_token: refreshToken }),
    );
  },

  revokeSession(refreshToken: string) {
    return requestAdmin<void>(
      "/sessions/revoke",
      jsonRequest("POST", { refresh_token: refreshToken }),
    );
  },
};
