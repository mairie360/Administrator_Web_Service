import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ServicesPanel } from './ServicesPanel';
import { administrationApi } from '@/lib/administration-api';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: { listServices: vi.fn(), createService: vi.fn(async () => undefined), renameService: vi.fn(async () => undefined), deleteService: vi.fn(async () => undefined) },
}));

const services = [
  { id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 2 },
  { id: 4, name: 'Urbanisme', created_at: '2026-11-20T08:00:00Z', agents: 0 },
];
const run = () => vi.fn(async (_key: string, _message: string, action: () => Promise<unknown>, refresh?: () => Promise<unknown>) => { await action(); await refresh?.(); return true; });

describe('ServicesPanel', () => {
  beforeEach(() => { vi.mocked(administrationApi.listServices).mockReset().mockResolvedValue(services); });

  it('MAIR-923: lists the services with their agents and creates one', async () => {
    const runAction = run();
    render(<ServicesPanel busyAction={null} runAction={runAction} />);
    expect(await screen.findByText('Voirie')).toBeTruthy();
    expect(screen.getByText('2 agents')).toBeTruthy();
    expect(screen.getByText('Aucun agent')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Nouveau service' }));
    await userEvent.type(screen.getByLabelText(/Nom du service/), 'Culture');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le service' }));
    expect(administrationApi.createService).toHaveBeenCalledWith('Culture');
    expect(administrationApi.listServices).toHaveBeenCalledTimes(2);
  });

  it('MAIR-923: renames a service from its row', async () => {
    render(<ServicesPanel busyAction={null} runAction={run()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Renommer le service Voirie' }));
    const field = screen.getByLabelText(/Nom du service/);
    await userEvent.clear(field);
    await userEvent.type(field, 'Voirie et réseaux');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(administrationApi.renameService).toHaveBeenCalledWith(3, 'Voirie et réseaux');
  });

  it('MAIR-923: the deletion warns that the agents lose their service', async () => {
    render(<ServicesPanel busyAction={null} runAction={run()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Supprimer le service Voirie' }));
    expect(screen.getByText(/compte 2 agents, qui ne seront plus rattachés/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    expect(administrationApi.deleteService).toHaveBeenCalledWith(3);
  });

  it('MAIR-923: a failed read offers to retry', async () => {
    vi.mocked(administrationApi.listServices).mockReset().mockRejectedValueOnce(new Error('down')).mockResolvedValueOnce(services);
    render(<ServicesPanel busyAction={null} runAction={run()} />);
    expect(await screen.findByText('Les services n’ont pas pu être chargés.')).toBeTruthy();
  });
});
