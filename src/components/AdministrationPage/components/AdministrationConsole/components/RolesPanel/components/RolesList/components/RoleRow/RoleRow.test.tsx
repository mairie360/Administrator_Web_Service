import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };

import { RoleRow } from './RoleRow';

describe('RoleRow', () => {
  it('shows the role and offers edit and delete', async () => {
    const onEdit = vi.fn(); const onDelete = vi.fn();
    render(<RoleRow role={role} deleting={false} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText('Agents de la mairie')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' })); expect(onEdit).toHaveBeenCalledWith(role);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' })); expect(onDelete).toHaveBeenCalledWith(role);
  });
});
