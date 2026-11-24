import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SecurityPanel } from './SecurityPanel';
import { administrationApi } from '@/lib/administration-api';
import { userRow } from '@tests/component/users-fixtures';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: {
    getTwoFactorPolicy: vi.fn(async () => ({ required: false, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true })),
    updateTwoFactorPolicy: vi.fn(async (policy) => policy),
    listUsers: vi.fn(async () => ({ users: [userRow(4, { two_factor: { methods: ['totp', 'backup_codes'], last_verified_at: '2026-11-20T08:42:30Z' } }), userRow(5, { first_name: 'Bob' })], page: 1, page_size: 10, total: 2, total_pages: 1 })),
    resetUserTwoFactor: vi.fn(async () => undefined),
  },
}));

const run = () => vi.fn(async (_key: string, _message: string, action: () => Promise<unknown>) => { await action(); return true; });

describe('SecurityPanel', () => {
  it('A1: makes the second factor mandatory and saves the policy', async () => {
    const runAction = run();
    render(<SecurityPanel busyAction={null} runAction={runAction} />);
    await userEvent.click(await screen.findByRole('switch', { name: /Double authentification obligatoire/ }));
    expect(screen.getByText('Modifications non enregistrées')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(administrationApi.updateTwoFactorPolicy).toHaveBeenCalledWith({ required: true, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true });
  });

  it('A1: at least one method stays allowed', async () => {
    render(<SecurityPanel busyAction={null} runAction={run()} />);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Application d’authentification' }));
    expect(screen.getByText('Autorisez au moins la passkey ou l’application d’authentification.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Enregistrer' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('A2: lists the agents with their method and resets one after a confirmation', async () => {
    const runAction = run();
    render(<SecurityPanel busyAction={null} runAction={runAction} />);
    expect(await screen.findByText('Application · Codes de secours')).toBeTruthy();
    expect(screen.getByText('Aucune')).toBeTruthy();
    expect(administrationApi.listUsers).toHaveBeenCalledWith({ page: 1, pageSize: 10, status: 'active' });
    await userEvent.click(screen.getByRole('button', { name: 'Réinitialiser la double authentification de Alice Dupont' }));
    await userEvent.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Réinitialiser' }));
    expect(administrationApi.resetUserTwoFactor).toHaveBeenCalledWith(4);
  });
});
