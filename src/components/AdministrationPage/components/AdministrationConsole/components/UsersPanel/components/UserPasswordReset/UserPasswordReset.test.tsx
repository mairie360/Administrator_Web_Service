import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UserPasswordReset } from './UserPasswordReset';

describe('UserPasswordReset', () => {
  it('flags a mismatch between the two passwords', () => {
    const { rerender } = render(<UserPasswordReset form={{ password: 'a', confirmation: 'a' }} busy={false} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<UserPasswordReset form={{ password: 'a', confirmation: 'b' }} busy={false} onChange={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('alert').textContent).toContain('ne correspondent pas');
  });
});
