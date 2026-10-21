import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LogoutFailure } from './LogoutFailure';

const navigateToLogin = vi.hoisted(() => vi.fn());
vi.mock('@/lib/logout', () => ({ navigateToLogin }));

describe('LogoutFailure', () => {
  it('announces the failure and offers the explicit return to Login', async () => {
    render(<LogoutFailure message="La déconnexion reste à vérifier." />);
    expect(screen.getByRole('alert').textContent).toContain('La déconnexion reste à vérifier.');
    await userEvent.click(screen.getByRole('button', { name: 'Retour à la connexion' }));
    expect(navigateToLogin).toHaveBeenCalledWith({ explicit: true });
  });
});
