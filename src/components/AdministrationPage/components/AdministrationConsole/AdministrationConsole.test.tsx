import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AdministrationConsole } from './AdministrationConsole';

vi.mock('./use-administration-data', () => ({ useAdministrationData: () => ({
  roles: [{ id: 9, name: 'Agent', description: '', can_be_deleted: true }], groups: null, loading: false, busyAction: null,
  refreshFailure: null, loadError: null, actionError: null, notice: null, authRequired: false, clearNotice: vi.fn(), clearActionError: vi.fn(),
  loadAll: vi.fn(), runAction: vi.fn(async () => true), confirmRoleDeletion: vi.fn(), refreshRoles: vi.fn(), refreshGroups: vi.fn(), applyGroupDeletion: vi.fn(),
}) }));
vi.mock('./components/UsersPanel/use-users-list', () => ({ useUsersList: () => ({
  usersPage: { users: [], page: 1, page_size: 6, total: 0, total_pages: 0 }, setUsersPage: vi.fn(), hasReceivedUsers: false, page: 1, search: '', status: '', roleId: null, sort: 'name',
  filtered: false, searchInput: '', usersLoading: true, setUsersLoading: vi.fn(), usersError: null, usersMutationConfirmed: false, confirmMutation: vi.fn(), invalidateReads: vi.fn(),
  loadUsers: vi.fn(), typeSearch: vi.fn(), submitSearch: vi.fn(), setStatus: vi.fn(), setRole: vi.fn(), setSort: vi.fn(), clearFilters: vi.fn(), goToPage: vi.fn(),
}) }));

describe('AdministrationConsole', () => {
  it('MAIR-885 composes the header, three counters, the tabs (Sécurité last) and the users panel by default', () => {
    render(<AdministrationConsole />);
    expect(screen.getByRole('heading', { level: 1, name: 'Administration' })).toBeTruthy();
    expect(screen.getByText('Comptes des agents, rôles et groupes de la mairie')).toBeTruthy();
    const tabs = screen.getByRole('tablist', { name: 'Sections d’administration' });
    expect([...tabs.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent?.trim())).toEqual(['Utilisateurs', 'Rôles', 'Groupes', 'Sécurité']);
    expect(screen.queryByText(/Sessions actives/)).toBeNull();
    expect(screen.getByRole('table', { name: 'Utilisateurs' })).toBeTruthy();
  });
});
