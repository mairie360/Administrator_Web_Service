import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProfileUnavailable } from './ProfileUnavailable';

describe('ProfileUnavailable', () => {
  it('announces the failed profile read and retries', async () => {
    const onRetry = vi.fn();
    render(<ProfileUnavailable error="Profil injoignable" onRetry={onRetry} />);
    expect(screen.getByRole('alert').textContent).toContain('Profil injoignable');
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
