import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UsersPanel } from './UsersPanel';

vi.mock('./use-users-list', () => ({ useUsersList: () => ({
  usersPage: { page: 1, total_pages: 1, total: 1, users: [{ id: 1, first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone_number: null, roles: [], is_archived: false, status: 'Actif' }] },
  setUsersPage: vi.fn(), hasReceivedUsers: true, page: 1, search: '', searchInput: '', usersLoading: false, setUsersLoading: vi.fn(), usersError: null,
  usersMutationConfirmed: false, confirmMutation: vi.fn(), invalidateReads: vi.fn(), loadUsers: vi.fn(), typeSearch: vi.fn(), submitSearch: vi.fn(), changePage: vi.fn(),
}) }));

describe('UsersPanel', () => {
  it('lists the received users with the creation action and asks to pick one', () => {
    render(<UsersPanel roles={[]} busyAction={null} runAction={vi.fn(async () => true)} onTotalChange={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Utilisateurs' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Nouvel utilisateur' })).toBeTruthy();
    expect(screen.getByText('alice@mairie.test')).toBeTruthy();
    expect(screen.getByText('Sélectionnez un utilisateur dans le tableau.')).toBeTruthy();
  });
});
