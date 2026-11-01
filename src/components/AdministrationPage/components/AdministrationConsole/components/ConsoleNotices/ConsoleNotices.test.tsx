import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ConsoleNotices } from './ConsoleNotices';

const base = { authRequired: false, loadError: null, notice: null, actionError: null, refreshFailure: null, busyAction: null, onCloseNotice: vi.fn(), onCloseError: vi.fn(), onRetryRefresh: vi.fn() };

describe('ConsoleNotices', () => {
  it('announces the expired session, the load error and a confirmed action whose refresh failed', async () => {
    const onRetryRefresh = vi.fn();
    const { rerender, container } = render(<ConsoleNotices {...base} />);
    expect(container.querySelectorAll('[role="alert"]')).toHaveLength(0);
    rerender(<ConsoleNotices {...base} authRequired />);
    expect(screen.getByRole('alert').textContent).toContain('Session administrateur requise');
    rerender(<ConsoleNotices {...base} loadError="Lecture refusée" />);
    expect(screen.getByRole('alert').textContent).toContain('Lecture refusée');
    rerender(<ConsoleNotices {...base} refreshFailure={{ message: 'Actualisation refusée', retry: onRetryRefresh } as never} onRetryRefresh={onRetryRefresh} />);
    expect(screen.getByRole('alert').textContent).toContain('n’ont pas pu être actualisées');
  });
});
