import { urlChoice, urlPage, urlText } from './page-url-state';
export const administrationUrlSchema = { tab: urlChoice(['users', 'roles', 'groups', 'sessions'], 'users') };
export const usersUrlSchema = { usersSearch: urlText(100), usersPage: urlPage };
export function administrationSearch(params: Record<string, string | string[] | undefined>): string {
  const schema = { ...administrationUrlSchema, ...usersUrlSchema };
  const result = new URLSearchParams();
  for (const [key, field] of Object.entries(schema)) {
    const value = params[key];
    if (typeof value === 'string' && field.accept(value)) result.set(key, value);
  }
  return result.toString();
}
