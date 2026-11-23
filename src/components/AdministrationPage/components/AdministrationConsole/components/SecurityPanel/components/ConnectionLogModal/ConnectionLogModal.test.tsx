import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConnectionLogModal, eventLabel } from '.';

const line = (action: string) => ({ action, sessionId: null, ipAddress: '92.184.10.1', deviceInfo: null, occurredAt: '2026-11-23T08:12:00+00:00' });

describe('ConnectionLogModal (MAIR-773)', () => {
  it('names the events in French with the beginning of the address, and closes', async () => {
    const onClose = vi.fn();
    render(<ConnectionLogModal agentName="Bob Martin" logs={[line('LOGIN'), line('STOLEN_SESSION_ATTEMPT'), line('IP_CHANGE')]} state="default" onRetry={vi.fn()} onClose={onClose} />);
    expect(screen.getByText('Journal des connexions — Bob Martin')).toBeTruthy();
    expect(screen.getByText('Connexion')).toBeTruthy();
    expect(screen.getByText('Tentative de vol de session')).toBeTruthy();
    expect(screen.getByText('Changement de réseau')).toBeTruthy();
    expect(screen.getAllByText('92.184.xxx.xxx')).toHaveLength(3);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer le journal' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('retries a journal that could not be read, says when it is empty, keeps an unknown event as is', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<ConnectionLogModal agentName="Bob Martin" logs={[]} state="unavailable" onRetry={onRetry} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ }));
    expect(onRetry).toHaveBeenCalled();
    rerender(<ConnectionLogModal agentName="Bob Martin" logs={[]} state="default" onRetry={onRetry} onClose={vi.fn()} />);
    expect(screen.getByText('Aucune connexion enregistrée.')).toBeTruthy();
    expect(eventLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
  });
});
