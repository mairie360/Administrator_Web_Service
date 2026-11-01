import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const user = (id: number, extra: Record<string, unknown> = {}) => ({ id, first_name: 'Alice', last_name: 'Dupont', email: `user${id}@mairie.test`, phone_number: null, roles: [{ id: 9, name: 'Agent' }], is_archived: false, status: 'Actif', ...extra }) as never;

import { UserRow, userStatus } from './UserRow';

describe('UserRow', () => {
  it('shows the identity, the status and selects on click or keyboard unless locked', async () => {
    const onSelect = vi.fn();
    const { rerender } = render(<table><tbody><UserRow user={user(1)} selected={false} locked={false} onSelect={onSelect} /></tbody></table>);
    expect(screen.getByText('user1@mairie.test')).toBeTruthy(); expect(screen.getByText('Actif').getAttribute('data-status')).toBe('active');
    await userEvent.click(screen.getByText('user1@mairie.test')); expect(onSelect).toHaveBeenCalledTimes(1);
    rerender(<table><tbody><UserRow user={user(1, { is_archived: true })} selected locked onSelect={onSelect} /></tbody></table>);
    expect(screen.getByText('Archivé').getAttribute('data-status')).toBe('inactive');
    render(userStatus(user(3)));
  });
});
