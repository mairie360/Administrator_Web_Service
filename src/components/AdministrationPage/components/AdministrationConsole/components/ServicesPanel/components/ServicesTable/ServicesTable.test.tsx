import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ServicesTable } from './ServicesTable';

const services = [{ id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 1 }];

describe('ServicesTable', () => {
  it('shows the agents of each service and opens the renaming from the row', async () => {
    const onRename = vi.fn();
    render(<ServicesTable services={services} loading={false} locked={false} onRename={onRename} onDelete={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('1 agent')).toBeTruthy();
    await userEvent.click(screen.getByText('Voirie'));
    expect(onRename).toHaveBeenCalledWith(services[0]);
  });

  it('tells when the mairie has no service yet', () => {
    render(<ServicesTable services={[]} loading={false} locked={false} onRename={vi.fn()} onDelete={vi.fn()} onRetry={vi.fn()} />);
    expect(screen.getByText('Aucun service pour le moment.')).toBeTruthy();
  });
});
