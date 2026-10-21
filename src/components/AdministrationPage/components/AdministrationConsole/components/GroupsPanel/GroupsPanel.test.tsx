import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
const group = { id: 3, name: 'Voirie', description: 'Entretien', owner_id: 7 } as never;

import { GroupsPanel } from './GroupsPanel';

describe('GroupsPanel', () => {
  it('lists the groups, the creation card and asks to pick a group', () => {
    render(<GroupsPanel groups={[group]} loading={false} busyAction={null} runAction={vi.fn(async () => true)} refreshGroups={vi.fn(async () => {})} onGroupDeleted={vi.fn()} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Groupes' })).toBeTruthy(); expect(screen.getByRole('heading', { level: 2, name: 'Créer un groupe' })).toBeTruthy();
    expect(screen.getByText('Voirie')).toBeTruthy(); expect(screen.getByText('Cliquez sur un groupe dans la liste.')).toBeTruthy();
  });
});
