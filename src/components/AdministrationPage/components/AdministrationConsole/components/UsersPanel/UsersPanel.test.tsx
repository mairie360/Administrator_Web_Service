import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersPanel } from './UsersPanel';
import { lastLoginLabel } from './users-model';
import { userRow } from '@tests/component/users-fixtures';

const list = { current: {} as Record<string, unknown> };
vi.mock('./use-users-list', () => ({ useUsersList: () => list.current }));
vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: { listUserSessions: vi.fn(async () => []), suspendUser: vi.fn(async () => undefined), reactivateUser: vi.fn(async () => undefined), deleteUser: vi.fn(async () => undefined) },
}));

const baseList = (users = [userRow(1), userRow(2, { first_name: 'Bob', account_status: 'suspended', active_sessions: 0 }), userRow(3, { first_name: 'Chloé', active_sessions: 2 })], extra: Record<string, unknown> = {}) => ({
  usersPage: { page: 1, page_size: 6, total: users.length, total_pages: 1, users }, setUsersPage: vi.fn(), hasReceivedUsers: true, page: 1, search: '', status: '', roleId: null, sort: 'name',
  filtered: false, searchInput: '', usersLoading: false, setUsersLoading: vi.fn(), usersError: null, usersMutationConfirmed: false, confirmMutation: vi.fn(), invalidateReads: vi.fn(),
  loadUsers: vi.fn(), typeSearch: vi.fn(), submitSearch: vi.fn(), setStatus: vi.fn(), setRole: vi.fn(), setSort: vi.fn(), clearFilters: vi.fn(), goToPage: vi.fn(), ...extra,
});

describe('UsersPanel', () => {
  it('MAIR-885 / MAIR-904 lists the users with their state and the « En ligne » pill, and opens the record on a row', async () => {
    list.current = baseList();
    render(<UsersPanel roles={[]} busyAction={null} runAction={vi.fn(async () => true)} onTotalChange={vi.fn()} currentUserId={1} />);
    expect(screen.getByRole('button', { name: 'Nouvel utilisateur' })).toBeTruthy();
    expect(screen.getByText('Suspendu')).toBeTruthy();
    expect(screen.getByText('En ligne · 2 sessions')).toBeTruthy();
    // One's own row offers neither suspension nor deletion.
    expect(screen.queryByRole('button', { name: 'Suspendre Alice Dupont' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Réactiver Bob Dupont' })).toBeTruthy();
    await userEvent.click(screen.getByText('user3@mairie.test'));
    const dialog = screen.getByRole('dialog', { name: 'Fiche utilisateur' });
    expect(within(dialog).getByText('Chloé Dupont')).toBeTruthy();
  });

  it('MAIR-904 confirms a suspension and reactivates at once', async () => {
    list.current = baseList();
    const runAction = vi.fn(async (_key: string, _message: string, action: () => Promise<unknown>) => { await action(); return true; });
    render(<UsersPanel roles={[]} busyAction={null} runAction={runAction} onTotalChange={vi.fn()} currentUserId={1} />);
    await userEvent.click(screen.getByRole('button', { name: 'Suspendre Chloé Dupont' }));
    await userEvent.click(within(screen.getByRole('alertdialog', { name: 'Suspendre le compte ?' })).getByRole('button', { name: 'Suspendre' }));
    expect(runAction).toHaveBeenCalledWith('suspend-user-3', 'Compte suspendu : toutes ses sessions ont été fermées.', expect.any(Function));
    await userEvent.click(screen.getByRole('button', { name: 'Réactiver Bob Dupont' }));
    expect(runAction).toHaveBeenCalledWith('reactivate-user-2', 'Compte réactivé', expect.any(Function));
  });

  it('MAIR-904 offers « Effacer les filtres » when nothing matches', async () => {
    const clearFilters = vi.fn();
    list.current = baseList([], { filtered: true, clearFilters });
    render(<UsersPanel roles={[]} busyAction={null} runAction={vi.fn(async () => true)} onTotalChange={vi.fn()} currentUserId={1} />);
    expect(screen.getByText('Aucun utilisateur ne correspond')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Effacer les filtres' }));
    expect(clearFilters).toHaveBeenCalled();
  });

  // MAIR-1259 (design-match): the list reads « 2 juil. 2026 » like the artifact; the user record keeps the time.
  it('MAIR-1259 shows the last sign-in date without the time in the list', () => {
    const user = { last_login_at: '2026-07-02T06:00:00Z' };
    expect(lastLoginLabel(user)).not.toMatch(/\d{2}:\d{2}/);
    expect(lastLoginLabel(user)).toMatch(/2 juil\.? 2026/);
    expect(lastLoginLabel(user, true)).toMatch(/\d{2}:\d{2}/);
    expect(lastLoginLabel({ last_login_at: null })).toBe('Jamais');
  });
});
