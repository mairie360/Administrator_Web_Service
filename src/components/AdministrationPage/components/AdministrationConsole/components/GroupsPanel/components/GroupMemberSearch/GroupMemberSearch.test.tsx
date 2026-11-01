import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupMemberSearch } from './GroupMemberSearch';

describe('GroupMemberSearch', () => {
  it('searches a user to add and shows the loading state', async () => {
    const onSearch = vi.fn();
    const { rerender } = render(<GroupMemberSearch search="" onSearch={onSearch} candidates={[]} loading={false} error={null} busyAction={null} onAdd={vi.fn()} />);
    await userEvent.type(screen.getByLabelText(/Ajouter un utilisateur/), 'm'); expect(onSearch).toHaveBeenCalledWith('m');
    rerender(<GroupMemberSearch search="m" onSearch={onSearch} candidates={[]} loading error={null} busyAction={null} onAdd={vi.fn()} />);
    expect(screen.getByText('Recherche des utilisateurs…')).toBeTruthy();
  });
});
