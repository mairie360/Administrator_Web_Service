import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupMembers } from './GroupMembers';

describe('GroupMembers', () => {
  it('shows the empty state and refreshes', async () => {
    const onRefresh = vi.fn();
    render(<GroupMembers members={[]} busyAction={null} onRefresh={onRefresh} onRemove={vi.fn()} />);
    expect(screen.getByText('Ce groupe ne contient aucun utilisateur.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser' })); expect(onRefresh).toHaveBeenCalledTimes(1);
  });
});
