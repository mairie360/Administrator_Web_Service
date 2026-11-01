import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const group = { id: 3, name: 'Voirie', description: 'Entretien', owner_id: 7 } as never;

import { GroupCard } from './GroupCard';

describe('GroupCard', () => {
  it('names the group and opens it', async () => {
    const onOpen = vi.fn();
    render(<GroupCard group={group} selected={false} onOpen={onOpen} />);
    await userEvent.click(screen.getByText('Voirie')); expect(onOpen).toHaveBeenCalledWith(3);
  });
});
