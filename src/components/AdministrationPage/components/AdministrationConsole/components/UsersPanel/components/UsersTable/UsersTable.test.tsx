import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersTable } from './UsersTable';
import { userRow } from '@tests/component/users-fixtures';

const handlers = () => ({ onSort: vi.fn(), onOpen: vi.fn(), onEdit: vi.fn(), onToggleSuspension: vi.fn(), onDelete: vi.fn(), onRetry: vi.fn() });

describe('UsersTable', () => {
  it('C3 / C6 / C10: rows open the record, actions keep their own click, states and « En ligne » pill', async () => {
    const on = handlers();
    render(<UsersTable users={[userRow(1, { active_sessions: 1 }), userRow(2, { first_name: 'Inès', account_status: 'invited', last_login_at: null })]} state="default" sort="name" currentUserId={null} locked={false} emptyTitle="" {...on} />);
    expect(screen.getByText('En ligne · 1 session')).toBeTruthy();
    expect(screen.getByText('Invité')).toBeTruthy(); expect(screen.getByText('Jamais')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier Inès Dupont' }));
    expect(on.onEdit).toHaveBeenCalled(); expect(on.onOpen).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('user1@mairie.test'));
    expect(on.onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    await userEvent.click(screen.getByRole('button', { name: /Utilisateur/ }));
    expect(on.onSort).toHaveBeenCalledWith('-name');
  });

  it('shows the error state with a retry', async () => {
    const on = handlers();
    render(<UsersTable users={[]} state="error" sort="name" currentUserId={null} locked={false} emptyTitle="" errorTitle="Service indisponible" {...on} />);
    expect(screen.getByText('Service indisponible')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ })); expect(on.onRetry).toHaveBeenCalled();
  });
});
