import type { AdministrationUser } from '@/lib/administration-api';

/** A V2 row of the users list, for the component tests. */
export const userRow = (id: number, extra: Partial<AdministrationUser> = {}): AdministrationUser => ({
  id, first_name: 'Alice', last_name: 'Dupont', email: `user${id}@mairie.test`, phone_number: null, phone_country: null,
  status: 'active', is_archived: false, roles: [{ id: 9, name: 'Agent' }], account_status: 'active', active_sessions: 0,
  last_login_at: '2026-11-20T08:42:11Z', two_factor: { methods: [], last_verified_at: null }, ...extra,
} as AdministrationUser);
