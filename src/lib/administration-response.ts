import type { AdministrationGroup, AdministrationRole, AdministrationService, AdministrationSession, AdministrationUsersPage } from './administration-api';
import type { AuthSession } from './auth-session-model';

export class InvalidAdministrationResponseError extends Error {
  constructor() { super('Les données d’administration reçues sont incohérentes. Réessayez.'); }
}
const invalid = (): never => { throw new InvalidAdministrationResponseError(); };
type Field = (value: unknown) => unknown;
const text: Field = value => typeof value === 'string' ? value : invalid();
const number: Field = value => typeof value === 'number' && Number.isFinite(value) ? value : invalid();
const boolean: Field = value => typeof value === 'boolean' ? value : invalid();
const nullable = (field: Field): Field => value => value === null ? null : field(value);
const array = (field: Field): Field => value => Array.isArray(value) ? value.map(field) : invalid();
function object(required: Record<string, Field>, optional: Record<string, Field> = {}): Field {
  return value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return invalid();
    const record = value as Record<string, unknown>;
    return Object.fromEntries([
      ...Object.entries(required).map(([key, field]) => [key, field(record[key])]),
      ...Object.entries(optional).filter(([key]) => record[key] !== undefined).map(([key, field]) => [key, field(record[key])]),
    ]);
  };
}
// Exact fields of Administration* schemas in the pinned contracts/openapi.json.
// Projection is shared by server and client reads; unknown nested keys are discarded.
const userRole = object({ id: number, name: text });
const choice = (values: readonly string[]): Field => value => typeof value === 'string' && values.includes(value) ? value : invalid();
const twoFactor = object({ methods: array(choice(['totp', 'passkey', 'backup_codes'])), last_verified_at: nullable(text) });
// MAIR-584 / MAIR-904: the V2 list carries the state, the open sessions, the last sign-in and the second factor.
const user = object({
  id: number, first_name: text, last_name: text, email: text, phone_number: nullable(text), status: text, is_archived: boolean, roles: array(userRole),
  account_status: choice(['active', 'invited', 'inactive', 'suspended']), active_sessions: number, last_login_at: nullable(text), two_factor: twoFactor,
}, { phone_country: nullable(text), service: nullable(object({ id: number, name: text })) });
// MAIR-916: the modules a role opens; MAIR-923: the colour and the project count of a group, the services.
export const ROLE_MODULES = ['dashboard', 'projects', 'calendar', 'messages', 'training', 'admin', 'settings'] as const;
export const GROUP_COLORS = ['blue', 'teal', 'green', 'orange', 'purple', 'pink', 'neutral'] as const;
const role = object({ id: number, name: text, description: text }, { can_be_deleted: nullable(boolean), modules: array(choice(ROLE_MODULES)) });
const group = object({ id: number, name: text, owner_id: number, description: nullable(text) }, { color: nullable(choice(GROUP_COLORS)), project_count: number });
const service = object({ id: number, name: text, created_at: text, agents: number });
const session = object({ id: text, device_info: text, ip_address: text, created_at: text, expires_at: text, revoked_at: nullable(text) });
const page = object({ users: array(user), page: number, page_size: number, total: number, total_pages: number });
export const parseUsersPage = (value: unknown): AdministrationUsersPage => page(value) as AdministrationUsersPage;
function collection(value: unknown, key: string, field: Field): unknown[] {
  return (object({ [key]: array(field) })(value) as Record<string, unknown[]>)[key];
}
export const parseRoles = (value: unknown): AdministrationRole[] => collection(value, 'roles', role) as AdministrationRole[];
export const parseGroups = (value: unknown): AdministrationGroup[] => collection(value, 'groups', group) as AdministrationGroup[];
export const parseSessions = (value: unknown): AdministrationSession[] => collection(value, 'sessions', session) as AdministrationSession[];
export const parseServices = (value: unknown): AdministrationService[] => collection(value, 'services', service) as AdministrationService[];
export const parseService = (value: unknown): AdministrationService => service(value) as AdministrationService;
export type InitialConsole = {
  users: AdministrationUsersPage | null;
  roles: AdministrationRole[] | null;
  groups: AdministrationGroup[] | null;
  error: string | null;
  usersError: string | null;
  authRequired: boolean;
};
export type InitialAdministration = { session: AuthSession; console: InitialConsole | null };
