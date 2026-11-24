import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SecurityAlerts, deviceOf, maskIpAddress } from '.';

const alert = (level: 'certain' | 'possible', id = 12) => ({
  id, level, ipAddress: '92.184.10.1', deviceInfo: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0', createdAt: '2026-11-23T08:12:00+00:00', acknowledgedAt: null,
  user: { id: 7, firstName: 'Bob', lastName: 'Martin' },
});

describe('SecurityAlerts (MAIR-773)', () => {
  it('shows each level, only the beginning of the address, and opens the journal of the agent', async () => {
    const onOpenJournal = vi.fn();
    render(<SecurityAlerts alerts={[alert('certain'), alert('possible', 13)]} state="default" onRetry={vi.fn()} onOpenJournal={onOpenJournal} />);
    expect(screen.getByText('Tentative certaine')).toBeTruthy();
    expect(screen.getByText('Tentative possible')).toBeTruthy();
    expect(screen.getAllByText(/92\.184\.xxx\.xxx/)).toHaveLength(2);
    expect(screen.queryByText(/92\.184\.10\.1/)).toBeNull();
    await userEvent.click(screen.getAllByRole('button', { name: 'Voir le journal des connexions de Bob Martin' })[0]);
    expect(onOpenJournal).toHaveBeenCalledWith(expect.objectContaining({ id: 12 }));
  });

  it('says when there is no alert, and retries an unavailable list', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<SecurityAlerts alerts={[]} state="default" onRetry={onRetry} onOpenJournal={vi.fn()} />);
    expect(screen.getByText('Aucune alerte ces 30 derniers jours.')).toBeTruthy();
    rerender(<SecurityAlerts alerts={[]} state="unavailable" onRetry={onRetry} onOpenJournal={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(onRetry).toHaveBeenCalled();
  });

  it('masks IPv4 and IPv6 addresses and names an unknown device', () => {
    expect(maskIpAddress('2001:db8:85a3::8a2e:370:7334')).toBe('2001:db8:85a3:xxxx::');
    expect(maskIpAddress(null)).toBe('Inconnue');
    expect(maskIpAddress('nonsense')).toBe('Inconnue');
    expect(deviceOf(null)).toBe('Appareil inconnu');
  });
});
