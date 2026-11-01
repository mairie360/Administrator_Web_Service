import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AdministrationConsole } from './AdministrationConsole';

vi.mock('./use-administration-data', () => ({ useAdministrationData: () => ({
  roles: [{ id: 9, name: 'Agent', description: '', can_be_deleted: true }], groups: null, activeSessions: null, sessionHistory: null, loading: false, busyAction: null,
  refreshFailure: null, loadError: null, actionError: null, notice: null, authRequired: false, clearNotice: vi.fn(), clearActionError: vi.fn(),
  loadAll: vi.fn(), runAction: vi.fn(async () => true), confirmRoleDeletion: vi.fn(), refreshRoles: vi.fn(), refreshGroups: vi.fn(), applyGroupDeletion: vi.fn(), refreshSessions: vi.fn(),
}) }));
vi.mock('./components/UsersPanel/use-users-list', () => ({ useUsersList: () => ({
  usersPage: null, setUsersPage: vi.fn(), hasReceivedUsers: false, page: 1, search: '', searchInput: '', usersLoading: true, setUsersLoading: vi.fn(), usersError: null,
  usersMutationConfirmed: false, confirmMutation: vi.fn(), invalidateReads: vi.fn(), loadUsers: vi.fn(), typeSearch: vi.fn(), submitSearch: vi.fn(), changePage: vi.fn(),
}) }));

describe('AdministrationConsole', () => {
  it('composes the header, the counters, the tabs and the users panel by default', () => {
    render(<AdministrationConsole />);
    expect(screen.getByRole('heading', { level: 1, name: 'Administration' })).toBeTruthy();
    expect(screen.getByRole('tablist', { name: 'Sections d’administration' })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: 'Utilisateurs' })).toBeTruthy();
    expect(screen.getByText('Chargement des utilisateurs…')).toBeTruthy();
  });
});
