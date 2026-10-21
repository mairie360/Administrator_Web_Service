import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const group = { id: 3, name: 'Voirie', description: 'Entretien', owner_id: 7 } as never;

import { GroupsList } from './GroupsList';

describe('GroupsList', () => {
  it('shows loading, unavailable, empty, then the groups', async () => {
    const onOpen = vi.fn();
    const { rerender } = render(<GroupsList groups={null} loading selectedId={null} onOpen={onOpen} />);
    expect(screen.getByText('Chargement des groupes…')).toBeTruthy();
    rerender(<GroupsList groups={null} loading={false} selectedId={null} onOpen={onOpen} />); expect(screen.getByRole('status').textContent).toContain('n’ont pas pu être chargés');
    rerender(<GroupsList groups={[]} loading={false} selectedId={null} onOpen={onOpen} />); expect(screen.getByText('Aucun groupe pour le moment.')).toBeTruthy();
    rerender(<GroupsList groups={[group]} loading={false} selectedId={null} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Voirie')); expect(onOpen).toHaveBeenCalledWith(3);
  });
});
