import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleHeader } from './ConsoleHeader';

describe('ConsoleHeader', () => {
  it('titles the console and refreshes unless locked', async () => {
    const onRefresh = vi.fn();
    const { rerender } = render(<ConsoleHeader loading={false} locked={false} onRefresh={onRefresh} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Administration' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Actualiser' })); expect(onRefresh).toHaveBeenCalledTimes(1);
    rerender(<ConsoleHeader loading={false} locked onRefresh={onRefresh} />);
    expect((screen.getByRole('button', { name: 'Actualiser' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
