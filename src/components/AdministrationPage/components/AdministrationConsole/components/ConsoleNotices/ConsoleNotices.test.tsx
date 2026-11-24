import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConsoleNotices } from './ConsoleNotices';

const base = { authRequired: false, loadError: null, notice: null, actionError: null, refreshFailure: null, busyAction: null, onCloseNotice: vi.fn(), onCloseError: vi.fn(), onRetryRefresh: vi.fn(), onReconnect: vi.fn(), reconnecting: false };

describe('ConsoleNotices', () => {
  it('announces the expired session, the load error and a confirmed action whose refresh failed', async () => {
    const onRetryRefresh = vi.fn();
    const { rerender, container } = render(<ConsoleNotices {...base} />);
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0);
    const onReconnect = vi.fn();
    rerender(<ConsoleNotices {...base} authRequired onReconnect={onReconnect} />);
    expect(screen.getByRole('alert').textContent).toContain('Session administrateur requise');
    // MAIR-910 F13: « Se reconnecter ».
    await userEvent.click(screen.getByRole('button', { name: 'Se reconnecter' }));
    expect(onReconnect).toHaveBeenCalled();
    rerender(<ConsoleNotices {...base} loadError="Lecture refusée" />);
    expect(screen.getByRole('alert').textContent).toContain('Lecture refusée');
    rerender(<ConsoleNotices {...base} refreshFailure={{ message: 'Actualisation refusée', retry: onRetryRefresh } as never} onRetryRefresh={onRetryRefresh} />);
    expect(screen.getByRole('alert').textContent).toContain('n’ont pas pu être actualisées');
  });
});
