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
});
