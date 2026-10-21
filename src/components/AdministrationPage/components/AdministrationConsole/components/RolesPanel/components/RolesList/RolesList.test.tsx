import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };

import { RolesList } from './RolesList';

describe('RolesList', () => {
  it('shows loading, unavailable, empty, then the roles', () => {
    const props = { busyAction: null, onEdit: vi.fn(), onDelete: vi.fn() };
    const { rerender } = render(<RolesList roles={null} loading {...props} />);
    expect(screen.getByText('Chargement des rôles…')).toBeTruthy();
    rerender(<RolesList roles={null} loading={false} {...props} />); expect(screen.getByRole('status').textContent).toContain('n’ont pas pu être chargés');
    rerender(<RolesList roles={[]} loading={false} {...props} />); expect(screen.getByText('Aucun rôle disponible.')).toBeTruthy();
    rerender(<RolesList roles={[role]} loading={false} {...props} />); expect(screen.getByText('Agent')).toBeTruthy();
  });
});
