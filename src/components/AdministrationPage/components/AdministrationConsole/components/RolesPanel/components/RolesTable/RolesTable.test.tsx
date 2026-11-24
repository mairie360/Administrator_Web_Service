import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RolesTable } from './RolesTable';

const roles = [{ id: 1, name: 'Admin', description: '', can_be_deleted: false }, { id: 6, name: 'Urbanisme', description: 'Permis', can_be_deleted: true }];

describe('RolesTable', () => {
  it('opens a role on its row or its pencil, deletes on its own button, shows the system roles', async () => {
    const onOpen = vi.fn(); const onDelete = vi.fn();
    render(<RolesTable roles={roles} loading={false} locked={false} selectedId={6} onOpen={onOpen} onDelete={onDelete} onRetry={vi.fn()} />);
    expect(screen.getByText('Rôle système')).toBeTruthy(); expect(screen.getByText('Sans description')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Urbanisme' }));
    expect(onDelete).toHaveBeenCalled(); expect(onOpen).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier le rôle Admin' }));
    expect(onOpen).toHaveBeenCalledWith(roles[0]);
  });

  it('shows the loading and error states', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<RolesTable roles={null} loading locked={false} selectedId={null} onOpen={vi.fn()} onDelete={vi.fn()} onRetry={onRetry} />);
    rerender(<RolesTable roles={null} loading={false} locked={false} selectedId={null} onOpen={vi.fn()} onDelete={vi.fn()} onRetry={onRetry} />);
    expect(screen.getByText('Les rôles n’ont pas pu être chargés.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ })); expect(onRetry).toHaveBeenCalled();
  });
});
