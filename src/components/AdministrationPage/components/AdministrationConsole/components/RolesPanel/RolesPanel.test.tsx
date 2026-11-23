import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RolesPanel } from './RolesPanel';
import { administrationApi } from '@/lib/administration-api';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: { listUsers: vi.fn(), createRole: vi.fn(async () => undefined), updateRole: vi.fn(async () => undefined), deleteRole: vi.fn(async () => undefined) },
}));

const roles = [
  { id: 1, name: 'Admin', description: 'Accès complet', can_be_deleted: false },
  { id: 6, name: 'Urbanisme', description: '', can_be_deleted: true },
];
const run = () => vi.fn(async (_key: string, _message: string, action: () => Promise<unknown>) => { await action(); return true; });

describe('RolesPanel', () => {
  it('F15 / F16: « Nouveau rôle » and a click on a row open the role modal', async () => {
    render(<RolesPanel roles={roles} loading={false} busyAction={null} runAction={run()} refreshRoles={vi.fn()} onRoleDeleted={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Nouveau rôle' }));
    expect(screen.getByRole('dialog', { name: 'Nouveau rôle' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await userEvent.click(screen.getByText('Urbanisme'));
    expect(screen.getByRole('dialog', { name: 'Modifier le rôle « Urbanisme »' })).toBeTruthy();
  });

  it('F17: a system role cannot be deleted, a held one warns with its accounts, a free one is confirmed', async () => {
    const runAction = run();
    const onRoleDeleted = vi.fn();
    vi.mocked(administrationApi.listUsers).mockResolvedValueOnce({ users: [], page: 1, page_size: 1, total: 3, total_pages: 3 }).mockResolvedValueOnce({ users: [], page: 1, page_size: 1, total: 0, total_pages: 0 });
    render(<RolesPanel roles={roles} loading={false} busyAction={null} runAction={runAction} refreshRoles={vi.fn()} onRoleDeleted={onRoleDeleted} />);
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Admin' }));
    expect(screen.getByRole('alertdialog', { name: 'Suppression impossible' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Compris' }));
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Urbanisme' }));
    expect(await screen.findByText(/attribué à 3 comptes/)).toBeTruthy();
    expect(administrationApi.listUsers).toHaveBeenCalledWith({ roleId: 6, pageSize: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer Urbanisme' }));
    const confirm = await screen.findByRole('alertdialog', { name: 'Supprimer le rôle ?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Supprimer' }));
    expect(administrationApi.deleteRole).toHaveBeenCalledWith(6);
    expect(onRoleDeleted).toHaveBeenCalledWith(6);
  });
});
