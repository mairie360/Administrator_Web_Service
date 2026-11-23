import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserRecordModal } from './UserRecordModal';
import { userRow } from '@tests/component/users-fixtures';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: { listUserSessions: vi.fn(async () => []) },
}));

const props = () => ({ currentUserId: 99, locked: false, onClose: vi.fn(), onEdit: vi.fn(), onToggleSuspension: vi.fn(), onDelete: vi.fn(), onRevoke: vi.fn(async () => true), onActiveCountChange: vi.fn() });

describe('UserRecordModal', () => {
  it('C4: identity, state and the actions Modifier, Suspendre, Supprimer; closes on Échap', async () => {
    const on = props();
    render(<UserRecordModal user={userRow(4, { first_name: 'Inès', phone_number: '+33612345678' })} {...on} />);
    expect(screen.getByRole('dialog', { name: 'Fiche utilisateur' })).toBeTruthy();
    expect(screen.getByText('+33612345678')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Suspendre' })); expect(on.onToggleSuspension).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' })); expect(on.onDelete).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' })); expect(on.onEdit).toHaveBeenCalled();
    await userEvent.keyboard('{Escape}'); expect(on.onClose).toHaveBeenCalled();
  });

  it('offers neither suspension nor deletion of one\'s own account, nothing without a user', () => {
    const { container } = render(<UserRecordModal user={null} {...props()} />);
    expect(container.textContent).toBe('');
    render(<UserRecordModal user={userRow(99, { account_status: 'suspended' })} {...props()} />);
    expect(screen.queryByRole('button', { name: 'Réactiver' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Supprimer' })).toBeNull();
  });
});
