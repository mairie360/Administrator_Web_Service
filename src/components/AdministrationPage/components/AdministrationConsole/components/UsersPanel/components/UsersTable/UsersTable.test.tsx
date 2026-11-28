import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UsersTable } from './UsersTable';
import { userRow } from '@tests/component/users-fixtures';

const handlers = () => ({ onSort: vi.fn(), onOpen: vi.fn(), onEdit: vi.fn(), onToggleSuspension: vi.fn(), onDelete: vi.fn(), onRetry: vi.fn() });

describe('UsersTable', () => {
  it('C3 / C6 / C10: rows open the record, actions keep their own click, states and « En ligne » pill', async () => {
    const on = handlers();
    render(<UsersTable users={[userRow(1, { active_sessions: 1 }), userRow(2, { first_name: 'Inès', account_status: 'invited', last_login_at: null })]} state="default" sort="name" currentUserId={null} locked={false} emptyTitle="" {...on} />);
    expect(screen.getByText('En ligne · 1 session')).toBeTruthy();
    expect(screen.getByText('Invité')).toBeTruthy(); expect(screen.getByText('Jamais')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Modifier Inès Dupont' }));
    expect(on.onEdit).toHaveBeenCalled(); expect(on.onOpen).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('user1@mairie.test'));
    expect(on.onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }));
    await userEvent.click(screen.getByRole('button', { name: /Utilisateur/ }));
    expect(on.onSort).toHaveBeenCalledWith('-name');
  });

  it('shows the error state with a retry', async () => {
    const on = handlers();
    render(<UsersTable users={[]} state="error" sort="name" currentUserId={null} locked={false} emptyTitle="" errorTitle="Service indisponible" {...on} />);
    expect(screen.getByText('Service indisponible')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ })); expect(on.onRetry).toHaveBeenCalled();
  });

  it('MAIR-1259 orders the columns Utilisateur, Rôle, Statut, Service, Dernière connexion, Actions', () => {
    render(<UsersTable users={[userRow(1, { service: { id: 4, name: 'Urbanisme' } })]} state="default" sort="name" currentUserId={null} locked={false} emptyTitle="" {...handlers()} />);
    const headers = screen.getAllByRole('columnheader').map((cell) => cell.textContent?.trim());
    expect(headers).toEqual(['Utilisateur', 'Rôle', 'Statut', 'Service', 'Dernière connexion', 'Actions']);
    const cells = screen.getAllByRole('row')[1].querySelectorAll('td, th');
    expect(cells[2].textContent).toContain('Actif'); expect(cells[3].textContent).toBe('Urbanisme');
  });

  it('MAIR-1259 highlights the administrator role tag only, and colours each initials avatar from the name', () => {
    render(<UsersTable users={[userRow(1, { roles: [{ id: 1, name: 'Admin' }] }), userRow(2, { first_name: 'Inès' })]} state="default" sort="name" currentUserId={null} locked={false} emptyTitle="" {...handlers()} />);
    const tags = [...document.querySelectorAll('[data-role="admin"]')];
    expect(tags.map((tag) => tag.textContent)).toEqual(['Admin']);
    expect(tags[0].className).toContain('--mairie-purple-surface');
    expect(screen.getByText('Agent').getAttribute('data-role')).toBeNull();
    const colours = [...document.querySelectorAll('[data-slot="avatar-fallback"]')].map((avatar) => avatar.getAttribute('data-colour'));
    expect(colours).toHaveLength(2);
    for (const colour of colours) expect(['dashboard', 'projects', 'calendar', 'messaging', 'training']).toContain(colour);
  });

  it('MAIR-1259 shows role tags as pills (administrator in purple), 40 px avatars and a mail icon before the e-mail', () => {
    render(<UsersTable users={[userRow(1, { roles: [{ id: 1, name: 'Admin' }] }), userRow(2, { first_name: 'Inès' })]} state="default" sort="name" currentUserId={null} locked={false} emptyTitle="" {...handlers()} />);
    const admin = document.querySelector('[data-role="admin"]')!;
    expect(admin.getAttribute('data-shape')).toBe('pill'); expect(admin.getAttribute('data-tone')).toBe('purple');
    const agent = screen.getByText('Agent');
    expect(agent.getAttribute('data-shape')).toBe('pill'); expect(agent.getAttribute('data-tone')).toBe('neutral');
    for (const identity of document.querySelectorAll('[data-m360-component~="UserIdentity"]')) {
      expect(identity.getAttribute('data-size')).toBe('l');
      expect(identity.querySelector('svg')).toBeTruthy();
    }
    expect(screen.getByText('user1@mairie.test').closest('[data-m360-component~="UserIdentity"]')).toBeTruthy();
  });
});
