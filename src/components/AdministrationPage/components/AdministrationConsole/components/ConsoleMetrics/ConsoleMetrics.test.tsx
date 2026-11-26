import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleMetrics } from './ConsoleMetrics';
import { consoleMetrics } from '../ConsoleTabs';

describe('ConsoleMetrics', () => {
  it('MAIR-885 shows three counters, « — » before a read, and opens a tab', async () => {
    const onOpen = vi.fn();
    render(<ConsoleMetrics metrics={consoleMetrics({ users: 12, roles: 3 })} activeTab="users" locked={false} onOpen={onOpen} />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByText('12')).toBeTruthy(); expect(screen.getAllByText('—')).toHaveLength(1);
    expect(screen.getByText('Modèles d’accès')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: /Rôles/ })); expect(onOpen).toHaveBeenCalledWith('roles');
  });

  it('MAIR-1221 names each counter by its whole visible text, so the name contains the visible label (RGAA 11.9)', () => {
    render(<ConsoleMetrics metrics={consoleMetrics({ users: 31, roles: 5, groups: 2 })} activeTab="users" locked={false} onOpen={vi.fn()} />);
    const normalize = (text: string | null) => (text ?? '').replace(/\s+/g, '');
    for (const button of screen.getAllByRole('button')) {
      // Same characters as what is shown, in the same order (« Utilisateurs : 31 » was refused).
      expect(normalize(button.getAttribute('aria-label'))).toBe(normalize(button.textContent));
    }
    expect(screen.getByRole('button', { name: 'Utilisateurs 31 Comptes des agents' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Rôles 5 Modèles d’accès' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Groupes 2 Services et équipes' })).toBeTruthy();
  });
});
