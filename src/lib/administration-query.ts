import type { AccountStatus, UsersQuery, UsersSort } from './administration-api';
import { urlChoice, urlPage, urlText } from './page-url-state';
// MAIR-885: three tabs, the sessions live in the user record (MAIR-894).
export const administrationUrlSchema = { tab: urlChoice(['users', 'roles', 'groups', 'security'], 'users') };
// MAIR-904: search, state and role filters, order and page of the users list. The keys added by V2 carry no
// « user » (status, role, sort): ZAP rule 10024 reads such a parameter name as sensitive data in the URL.
export const usersUrlSchema = {
  usersSearch: urlText(100),
  usersPage: urlPage,
  status: urlChoice(['', 'active', 'invited', 'inactive', 'suspended'], ''),
  role: { defaultValue: '', accept: (value: string) => value === '' || /^[1-9]\d{0,8}$/.test(value) },
  sort: urlChoice(['name', '-name'], 'name'),
};
/** The users read of a page URL state. */
export function usersQueryOf(state: Record<string, string>): UsersQuery {
  return {
    page: Number(state.usersPage) || 1,
    search: state.usersSearch ?? '',
    status: (state.status ?? '') as AccountStatus | '',
    roleId: state.role ? Number(state.role) : null,
    sort: (state.sort || 'name') as UsersSort,
  };
}
export function administrationSearch(params: Record<string, string | string[] | undefined>): string {
  const schema = { ...administrationUrlSchema, ...usersUrlSchema };
  const result = new URLSearchParams();
  for (const [key, field] of Object.entries(schema)) {
    const value = params[key];
    if (typeof value === 'string' && field.accept(value)) result.set(key, value);
  }
  return result.toString();
}
