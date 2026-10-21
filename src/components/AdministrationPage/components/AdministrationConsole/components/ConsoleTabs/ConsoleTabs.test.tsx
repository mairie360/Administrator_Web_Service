import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleTabs } from './ConsoleTabs';
import { administrationTabs } from './console-tabs';

describe('ConsoleTabs', () => {
  it('renders the four sections with stable ids and changes the tab', async () => {
    const onChange = vi.fn();
    render(<ConsoleTabs value="users" locked={false} onChange={onChange} />);
    const tabs = within(screen.getByRole('tablist', { name: 'Sections d’administration' })).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(administrationTabs.map((tab) => tab.label));
    expect(tabs[0].id).toBe('administration-tab-users');
    await userEvent.click(tabs[2]); expect(onChange).toHaveBeenCalledWith('groups');
  });
});
