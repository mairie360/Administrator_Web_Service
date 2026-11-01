import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersSearch } from './UsersSearch';

describe('UsersSearch', () => {
  it('types into the search and submits it', async () => {
    const onType = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault());
    render(<UsersSearch value="" onType={onType} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByPlaceholderText('Rechercher par nom, prénom ou e-mail'), 'a'); expect(onType).toHaveBeenCalledWith('a');
    fireEvent.submit(screen.getByRole('search')); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
