import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const user = (id: number, extra: Record<string, unknown> = {}) => ({ id, first_name: 'Alice', last_name: 'Dupont', email: `user${id}@mairie.test`, phone_number: null, roles: [{ id: 9, name: 'Agent' }], is_archived: false, status: 'Actif', ...extra }) as never;

import { UsersTable } from './UsersTable';

describe('UsersTable', () => {
  it('lists the users and selects one', async () => {
    const onSelect = vi.fn();
    render(<UsersTable users={[user(1), user(2)]} selectedId={2} locked={false} onSelect={onSelect} />);
    expect(screen.getAllByText('user1@mairie.test')).toHaveLength(1);
    await userEvent.click(screen.getByText('user1@mairie.test')); expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
  });
});
