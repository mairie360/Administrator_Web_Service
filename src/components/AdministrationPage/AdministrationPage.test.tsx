import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import AdministrationPage from './AdministrationPage';

const session = vi.hoisted(() => ({ current: { user: { name: 'Admin' }, isAdmin: false, loading: true, error: null as string | null, retry: vi.fn() } }));
vi.mock('@/lib/auth-session', () => ({ useAuthSession: () => session.current, logoutAndReload: vi.fn() }));
vi.mock('@/lib/navigation', () => ({ getActiveFrontHrefs: () => ({}) }));

describe('AdministrationPage', () => {
  it('checks the profile first, then refuses a non-administrator', () => {
    const { rerender } = render(<AdministrationPage />);
    expect(screen.getByText('Vérification du profil…')).toBeTruthy();
    session.current = { ...session.current, loading: false, error: 'Profil injoignable' };
    rerender(<AdministrationPage />);
    expect(screen.getByRole('alert').textContent).toContain('Profil injoignable');
    session.current = { ...session.current, error: null, isAdmin: false };
    rerender(<AdministrationPage />);
    expect(screen.getByText('Accès réservé aux administrateurs')).toBeTruthy();
  });
});
