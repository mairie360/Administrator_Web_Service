import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const group = { id: 3, name: 'Voirie', description: 'Entretien', owner_id: 7 } as never;

import { GroupsPanel } from './GroupsPanel';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: {
    listProjectsWithoutGroup: vi.fn(async () => ({ total: 0, projects: [] })),
    getGroup: vi.fn(async () => ({ id: 3, name: 'Voirie', description: 'Entretien', owner_id: 7 })),
    listGroupUsers: vi.fn(async () => []),
    listUsers: vi.fn(async () => ({ users: [], page: 1, page_size: 20, total: 0, total_pages: 0 })),
  },
}));

describe('GroupsPanel', () => {
  it('F18 / F19 / F21: projects without group, cards, « Nouveau groupe » in a modal, the group in a drawer', async () => {
    render(<GroupsPanel groups={[group]} loading={false} busyAction={null} runAction={vi.fn(async () => true)} refreshGroups={vi.fn(async () => {})} onGroupDeleted={vi.fn()} />);
    expect(await screen.findByText('Tous les projets ont un groupe')).toBeTruthy();
    expect(screen.getByText('Voirie')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Nouveau groupe' }));
    expect(screen.getByRole('dialog', { name: 'Nouveau groupe' })).toBeTruthy();
    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByText('Voirie'));
    expect(await screen.findByRole('dialog', { name: 'Voirie' })).toBeTruthy();
  });

  it('MAIR-1221 the fields of the group drawer have a legend (RGAA 11.6)', async () => {
    render(<GroupsPanel groups={[group]} loading={false} busyAction={null} runAction={vi.fn(async () => true)} refreshGroups={vi.fn(async () => {})} onGroupDeleted={vi.fn()} />);
    await userEvent.click(screen.getByText('Voirie'));
    const drawer = await screen.findByRole('dialog', { name: 'Voirie' });
    const fieldset = drawer.querySelector('fieldset');
    expect(fieldset?.querySelector(':scope > legend')?.textContent).toBe('Groupe Voirie');
  });
});
