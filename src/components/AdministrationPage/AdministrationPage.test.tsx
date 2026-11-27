import { describe, it, expect, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';

import AdministrationPage from './AdministrationPage';

const session = vi.hoisted(() => ({ current: { user: { name: 'Admin' }, isAdmin: false, loading: true, error: null as string | null, retry: vi.fn() } }));
vi.mock('@/lib/auth-session', () => ({ useAuthSession: () => session.current, logoutAndReload: vi.fn() }));
vi.mock('@/lib/navigation', () => ({ getActiveFrontHrefs: () => ({}) }));
vi.mock('./components/AdministrationConsole', () => ({ AdministrationConsole: () => <p>Console</p> }));

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

  it('MAIR-1221 uses the shared header with the commune of the deployment and the mockup padding', () => {
    session.current = { ...session.current, loading: true, error: null };
    const { container, rerender } = render(<AdministrationPage commune="Saint-Martin" />);
    expect(screen.getByRole('banner').textContent).toContain('Saint-Martin');
    expect(container.querySelector('aside')?.textContent).toContain('Saint-Martin');
    expect(container.querySelector('main div.p-6')).toBeTruthy();
    rerender(<AdministrationPage />);
    // Without a configured commune, neither the previous one nor the library sample is shown.
    for (const region of [screen.getByRole('banner'), container.querySelector('aside')]) {
      expect(region?.textContent).not.toContain('Saint-Martin');
      expect(region?.textContent).not.toContain('Saint-André');
    }
  });

  it('MAIR-1259 the header search finds agents: typing opens the users tab on that search, page 1', async () => {
    vi.useFakeTimers();
    try {
      window.history.replaceState(null, '', '/?tab=roles&usersPage=3');
      session.current = { ...session.current, loading: false, error: null, isAdmin: true };
      render(<AdministrationPage />);
      const field = screen.getByPlaceholderText('Rechercher un agent…');
      expect(field.closest('header')).toBeTruthy();
      fireEvent.change(field, { target: { value: ' Urbanisme ' } });
      await act(async () => { vi.advanceTimersByTime(250); });
      const params = new URLSearchParams(window.location.search);
      expect(params.get('tab')).toBeNull(); // « users » is the default tab
      expect(params.get('usersSearch')).toBe('Urbanisme');
      expect(params.get('usersPage')).toBeNull();
    } finally {
      vi.useRealTimers();
      window.history.replaceState(null, '', '/');
    }
  });

  it('MAIR-1259 no header search before the administrator profile is confirmed', () => {
    session.current = { ...session.current, loading: false, error: null, isAdmin: false };
    render(<AdministrationPage />);
    expect(screen.queryByPlaceholderText('Rechercher un agent…')).toBeNull();
  });
});
