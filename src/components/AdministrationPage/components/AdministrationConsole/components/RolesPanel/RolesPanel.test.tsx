import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };

import { RolesPanel } from './RolesPanel';

describe('RolesPanel', () => {
  it('lists the roles with the refresh action and the role form', () => {
    render(<RolesPanel roles={[role]} loading={false} busyAction={null} runAction={vi.fn(async () => true)} refreshRoles={vi.fn(async () => {})} onRoleDeleted={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Rôles disponibles' })).toBeTruthy();
    expect(screen.getByText('Agent')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Créer' })).toBeTruthy();
  });
});
