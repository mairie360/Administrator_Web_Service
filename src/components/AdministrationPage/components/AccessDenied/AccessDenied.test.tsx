import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AccessDenied } from './AccessDenied';

describe('AccessDenied', () => {
  it('MAIR-910 F14: tells a non-administrator the console is reserved', () => {
    render(<AccessDenied />);
    expect(screen.getByText('Accès réservé aux administrateurs')).toBeTruthy();
    expect(screen.getByText(/Demandez l’accès à un administrateur/)).toBeTruthy();
  });
});
