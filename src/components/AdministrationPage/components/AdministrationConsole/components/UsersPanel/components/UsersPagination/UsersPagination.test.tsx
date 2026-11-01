import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersPagination } from './UsersPagination';

const page = { page: 1, total_pages: 3, total: 41 } as never;

describe('UsersPagination', () => {
  it('shows the total and moves between pages', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<UsersPagination usersPage={page} page={1} loading={false} received mutationConfirmed={false} onChange={onChange} />);
    expect(screen.getByText(/41 utilisateurs/)).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Page précédente' }) as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: 'Page suivante' })); expect(onChange).toHaveBeenCalledWith(1);
    rerender(<UsersPagination usersPage={page} page={3} loading={false} received={false} mutationConfirmed onChange={onChange} />);
    expect(screen.getByText(/Total à actualiser/)).toBeTruthy(); expect((screen.getByRole('button', { name: 'Page suivante' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
