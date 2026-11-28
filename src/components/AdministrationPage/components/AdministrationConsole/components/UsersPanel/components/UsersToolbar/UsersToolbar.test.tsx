import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersToolbar } from './UsersToolbar';

describe('UsersToolbar', () => {
  it('F01–F03: types a search, submits it and creates', async () => {
    const onType = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault()); const onCreate = vi.fn();
    render(<UsersToolbar searchInput="" status="" roleId={null} roles={[{ id: 3, name: 'Agent', description: '' }]} locked={false}
      onType={onType} onSubmit={onSubmit} onStatus={vi.fn()} onRole={vi.fn()} onCreate={onCreate} />);
    await userEvent.type(screen.getByRole('searchbox'), 'a'); expect(onType).toHaveBeenCalledWith('a');
    fireEvent.submit(screen.getByRole('search')); expect(onSubmit).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Nouvel utilisateur' })); expect(onCreate).toHaveBeenCalled();
    expect(screen.getByText(/Tous les statuts|Statut/)).toBeTruthy();
  });

  it('MAIR-1259 searches by name, e-mail or service, then filters « Rôle : tous » before « Statut : tous »', () => {
    const { rerender } = render(<UsersToolbar searchInput="" status="" roleId={null} roles={[{ id: 3, name: 'Agent', description: '' }]} locked={false}
      onType={vi.fn()} onSubmit={vi.fn()} onStatus={vi.fn()} onRole={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByRole('searchbox').getAttribute('placeholder')).toBe('Nom, e-mail ou service');
    const filters = () => screen.getAllByRole('button').filter((button) => button.getAttribute('aria-haspopup') === 'menu').map((button) => button.textContent);
    expect(filters()).toEqual(['Rôle : tous', 'Statut : tous']);
    rerender(<UsersToolbar searchInput="" status="suspended" roleId={3} roles={[{ id: 3, name: 'Agent', description: '' }]} locked={false}
      onType={vi.fn()} onSubmit={vi.fn()} onStatus={vi.fn()} onRole={vi.fn()} onCreate={vi.fn()} />);
    expect(filters()).toEqual(['Rôle : Agent', 'Statut : Suspendu']);
  });

  // MAIR-1259 (design-match): the artifact's « Rôle : tous » / « Statut : tous » start with a funnel, then the chevron.
  it('MAIR-1259 draws the filters with the funnel icon and the chevron, as the artifact', () => {
    render(<UsersToolbar searchInput="" status="" roleId={null} roles={[]} locked={false}
      onType={vi.fn()} onSubmit={vi.fn()} onStatus={vi.fn()} onRole={vi.fn()} onCreate={vi.fn()} />);
    for (const filter of screen.getAllByRole('button').filter((button) => button.getAttribute('aria-haspopup') === 'menu')) {
      expect(filter.querySelectorAll('svg')).toHaveLength(2);
    }
  });
});
