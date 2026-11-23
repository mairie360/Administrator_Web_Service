import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RoleModal, roleNameError } from './RoleModal';

const roles = [{ id: 1, name: 'Admin', description: '', can_be_deleted: false }, { id: 6, name: 'Urbanisme', description: '', can_be_deleted: true }];

describe('RoleModal', () => {
  it('validates the name: required and unique, whatever the case', () => {
    expect(roleNameError('  ', roles, null)).toBe('Indiquez un nom de rôle.');
    expect(roleNameError(' urbanisme ', roles, null)).toBe('Un rôle porte déjà ce nom.');
    expect(roleNameError('Urbanisme', roles, 6)).toBeNull();
  });

  it('F16: keeps the modal open on an error under the field, creates on Entrée', async () => {
    const onSave = vi.fn(async () => true); const onClose = vi.fn();
    render(<RoleModal target="new" roles={roles} saving={false} onClose={onClose} onSave={onSave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Créer le rôle' }));
    expect(screen.getByText('Indiquez un nom de rôle.')).toBeTruthy(); expect(onSave).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/Nom du rôle/), 'Finances{Enter}');
    expect(onSave).toHaveBeenCalledWith({ name: 'Finances', description: '', can_be_deleted: true, modules: ['dashboard'] });
    expect(onClose).toHaveBeenCalled();
  });

  it('F15: « Enregistrer » waits for a change; a system role cannot be renamed', async () => {
    const onSave = vi.fn(async () => true);
    const { rerender } = render(<RoleModal target={roles[1]} roles={roles} saving={false} onClose={vi.fn()} onSave={onSave} />);
    expect(screen.getByText('Aucune modification à enregistrer.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Enregistrer' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.type(screen.getByLabelText(/Description/), 'Permis');
    expect(screen.getByText('Modifications non enregistrées')).toBeTruthy();
    rerender(<RoleModal target={roles[0]} roles={roles} saving={false} onClose={vi.fn()} onSave={onSave} />);
    expect((screen.getByLabelText(/Nom du rôle/) as HTMLInputElement).disabled).toBe(true);
    rerender(<RoleModal target={null} roles={roles} saving={false} onClose={vi.fn()} onSave={onSave} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('RoleModal modules (MAIR-916)', () => {
  it('a new role opens the dashboard; the checked modules are saved in navigation order', async () => {
    const onSave = vi.fn(async () => true);
    render(<RoleModal target="new" roles={[]} saving={false} onClose={vi.fn()} onSave={onSave} />);
    expect((screen.getByLabelText('Tableau de bord') as HTMLInputElement).checked).toBe(true);
    await userEvent.click(screen.getByLabelText('Calendrier'));
    await userEvent.click(screen.getByLabelText('Projets'));
    await userEvent.type(screen.getByLabelText(/Nom du rôle/), 'Agent');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le rôle' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ name: 'Agent', modules: ['dashboard', 'projects', 'calendar'] }));
  });

  it('the Admin role keeps the administration module', () => {
    render(<RoleModal target={{ id: 1, name: 'Admin', description: '', can_be_deleted: false, modules: ['dashboard', 'admin'] }} roles={[]} saving={false} onClose={vi.fn()} onSave={vi.fn()} />);
    const admin = screen.getByLabelText('Administration') as HTMLInputElement;
    expect(admin.checked).toBe(true);
    expect(admin.disabled).toBe(true);
  });
});
