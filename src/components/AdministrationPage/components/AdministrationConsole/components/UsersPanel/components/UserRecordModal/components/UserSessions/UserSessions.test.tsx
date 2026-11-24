import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserSessions, emptySessions, splitSessions } from './UserSessions';
import { administrationApi } from '@/lib/administration-api';

// A plain function, not a mock, for the failure: vitest records the promise a mock returns.
const failing = vi.hoisted(() => ({ on: false }));
vi.mock('@/lib/administration-api', async (original) => {
  const listed = vi.fn();
  return {
    ...(await original<typeof import('@/lib/administration-api')>()),
    administrationApi: {
      listUserSessions: Object.assign((...args: unknown[]) => failing.on ? new Promise((_resolve, reject) => setTimeout(() => reject(new Error('down')), 0)) : listed(...args), { mocked: listed }),
      revokeUserSession: vi.fn(async () => undefined), revokeUserSessions: vi.fn(async () => undefined),
    },
  };
});
const listUserSessions = () => (administrationApi.listUserSessions as unknown as { mocked: ReturnType<typeof vi.fn> }).mocked;

const now = Date.now();
const iso = (offset: number) => new Date(now + offset).toISOString();
const DAY = 86_400_000;
const active = { id: 'a1', device_info: 'Mozilla/5.0 (Windows NT 10.0) Firefox/132.0', ip_address: '203.0.113.24', created_at: iso(-DAY), expires_at: iso(DAY), revoked_at: null };
const revoked = { ...active, id: 'r1', revoked_at: iso(-2 * DAY) };
const old = { ...active, id: 'o1', created_at: iso(-60 * DAY), expires_at: iso(-50 * DAY) };

describe('UserSessions', () => {
  beforeEach(() => { listUserSessions().mockReset(); failing.on = false; });

  it('C5: splits the active sessions from the 30-day history, empty states by account state', () => {
    expect(splitSessions([active, revoked, old], now)).toEqual({ active: [active], history: [revoked] });
    expect(emptySessions('invited', 'Camille Roux').description).toBe('Camille Roux n’a pas encore activé son compte.');
    expect(emptySessions('suspended', 'X').description).toMatch(/toutes ses sessions ont été fermées/);
    expect(emptySessions('active', 'X').description).toBeUndefined();
  });

  it('C5 / C12: « Tout déconnecter » asks first, with a secondary button, then reloads', async () => {
    listUserSessions().mockResolvedValueOnce([active, revoked]).mockResolvedValueOnce([revoked]);
    const onRevoke = vi.fn(async (action: () => Promise<void>) => { await action(); return true; });
    const onActiveCountChange = vi.fn();
    render(<UserSessions userId={4} name="Inès Dupont" status="active" locked={false} onRevoke={onRevoke} onActiveCountChange={onActiveCountChange} />);
    await screen.findByText('Historique des connexions (30 jours)');
    expect(onActiveCountChange).toHaveBeenCalledWith(1);
    await userEvent.click(screen.getByRole('button', { name: 'Tout déconnecter' }));
    const confirm = screen.getByRole('alertdialog', { name: 'Déconnecter toutes les sessions ?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Tout déconnecter' }));
    expect(administrationApi.revokeUserSessions).toHaveBeenCalledWith(4);
    await vi.waitFor(() => expect(onActiveCountChange).toHaveBeenLastCalledWith(0));
  });

  it('shows the unavailable state when the BFF does not answer', async () => {
    failing.on = true;
    render(<UserSessions userId={4} name="Inès" status="active" locked={false} onRevoke={vi.fn()} onActiveCountChange={vi.fn()} />);
    expect(await screen.findByText('Sessions indisponibles')).toBeTruthy();
  });
});
