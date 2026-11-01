import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { RoleChangeWarning } from './RoleChangeWarning';

describe('RoleChangeWarning', () => {
  it('lists the unconfirmed role changes', () => {
    render(<RoleChangeWarning messages={['Rôle Agent non confirmé']} />);
    expect(screen.getByRole('alert').textContent).toContain('Rôle Agent non confirmé');
  });
});
