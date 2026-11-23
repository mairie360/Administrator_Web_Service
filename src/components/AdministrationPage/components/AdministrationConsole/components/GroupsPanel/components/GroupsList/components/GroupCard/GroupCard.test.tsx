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

describe('GroupCard colour and projects (MAIR-923)', () => {
  it('borders the card with the colour of the group and counts its projects', () => {
    render(<GroupCard group={{ id: 4, name: 'Culture', description: null, owner_id: 7, color: 'teal', project_count: 2 } as never} selected={false} onOpen={vi.fn()} />);
    const card = screen.getByRole('button', { name: /Culture/ });
    expect(card.getAttribute('data-group-color')).toBe('teal');
    expect(card.style.borderLeftColor).toBe('var(--mairie-module-projects)');
    expect(screen.getByText('2 projets')).toBeTruthy();
  });

  it('keeps the neutral border and says when the group has no project', () => {
    render(<GroupCard group={{ id: 5, name: 'Sport', description: null, owner_id: 7, color: null } as never} selected={false} onOpen={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Sport/ }).getAttribute('data-group-color')).toBe('default');
    expect(screen.getByText('Aucun projet')).toBeTruthy();
  });
});
