import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SessionsViewSwitch } from './SessionsViewSwitch';

describe('SessionsViewSwitch', () => {
  it('shows both views with their counts and switches', async () => {
    const onChange = vi.fn();
    render(<SessionsViewSwitch view="active" onChange={onChange} activeCount={2} historyCount={5} />);
    expect(screen.getByText('Actives (2)')).toBeTruthy();
    await userEvent.click(screen.getByText('Historique (5)')); expect(onChange).toHaveBeenCalledWith('history');
  });
});
