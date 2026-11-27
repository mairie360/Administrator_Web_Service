import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleTabs } from './ConsoleTabs';
import { administrationTabs } from './console-tabs';

const tabsOf = () => within(screen.getByRole('tablist', { name: 'Sections d’administration' })).getAllByRole('tab');

describe('ConsoleTabs', () => {
  it('renders the sections with stable ids and changes the tab', async () => {
    const onChange = vi.fn();
    render(<ConsoleTabs value="users" locked={false} onChange={onChange} />);
    const tabs = tabsOf();
    expect(tabs.map((tab) => tab.textContent)).toEqual(administrationTabs.map((tab) => tab.label));
    expect(tabs[0].id).toBe('administration-tab-users');
    await userEvent.click(tabs[2]); expect(onChange).toHaveBeenCalledWith('groups');
  });

  it('MAIR-1259 shows only Utilisateurs, Rôles and Groupes, each with its count once read', () => {
    render(<ConsoleTabs value="users" locked={false} counts={{ users: 31, roles: 5, groups: 2 }} onChange={vi.fn()} />);
    expect(tabsOf().map((tab) => tab.textContent)).toEqual(['Utilisateurs31', 'Rôles5', 'Groupes2']);
    expect(screen.queryByRole('tab', { name: /Services/ })).toBeNull();
    expect(screen.queryByRole('tab', { name: /Sécurité/ })).toBeNull();
  });

  it('MAIR-1259 shows no count before the read', () => {
    render(<ConsoleTabs value="roles" locked={false} counts={{ users: null, roles: 4 }} onChange={vi.fn()} />);
    expect(tabsOf().map((tab) => tab.textContent)).toEqual(['Utilisateurs', 'Rôles4', 'Groupes']);
  });
});
