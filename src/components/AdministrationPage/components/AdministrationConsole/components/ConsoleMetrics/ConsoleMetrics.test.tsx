import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleMetrics } from './ConsoleMetrics';
import { consoleMetrics } from '../ConsoleTabs';

describe('ConsoleMetrics', () => {
  it('shows the four counters, « — » before a read, and opens a tab', async () => {
    const onOpen = vi.fn();
    render(<ConsoleMetrics metrics={consoleMetrics({ users: 12, roles: 3 })} activeTab="users" locked={false} onOpen={onOpen} />);
    expect(screen.getByText('12')).toBeTruthy(); expect(screen.getAllByText('—')).toHaveLength(2);
    await userEvent.click(screen.getByRole('button', { name: /Rôles/ })); expect(onOpen).toHaveBeenCalledWith('roles');
  });
});
