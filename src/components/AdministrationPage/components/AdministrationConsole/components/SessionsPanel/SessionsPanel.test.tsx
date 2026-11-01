import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionsPanel } from './SessionsPanel';

describe('SessionsPanel', () => {
  it('shows the sessions card with its switch and refresh', async () => {
    const runAction = vi.fn(async () => true); const refreshSessions = vi.fn(async () => {});
    render(<SessionsPanel activeSessions={[]} sessionHistory={[]} loading={false} busyAction={null} runAction={runAction} refreshSessions={refreshSessions} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Sessions' })).toBeTruthy();
    expect(screen.getByText('Actives (0)')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser' })); expect(runAction).toHaveBeenCalledWith('refresh-sessions', 'Sessions actualisées.', refreshSessions);
  });
});
