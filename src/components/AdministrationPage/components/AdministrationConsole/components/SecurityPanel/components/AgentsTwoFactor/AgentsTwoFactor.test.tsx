import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AgentsTwoFactor, twoFactorMethods } from './AgentsTwoFactor';
import { userRow } from '@tests/component/users-fixtures';

describe('AgentsTwoFactor', () => {
  it('names the methods, offers no reset without a factor, retries an error', async () => {
    expect(twoFactorMethods(userRow(1, { two_factor: { methods: ['passkey'], last_verified_at: null } }))).toBe('Passkey');
    const onRetry = vi.fn();
    const { rerender } = render(<AgentsTwoFactor page={null} state="error" locked={false} onPage={vi.fn()} onRetry={onRetry} onReset={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ })); expect(onRetry).toHaveBeenCalled();
    rerender(<AgentsTwoFactor page={{ users: [userRow(1)], page: 1, page_size: 10, total: 1, total_pages: 1 }} state="default" locked={false} onPage={vi.fn()} onRetry={onRetry} onReset={vi.fn()} />);
    expect(screen.getByText('Jamais')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Réinitialiser/ })).toBeNull();
  });
});
