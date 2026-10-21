import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { AccessDenied } from './AccessDenied';

describe('AccessDenied', () => {
  it('tells a non-administrator the console is reserved', () => {
    render(<AccessDenied />);
    expect(screen.getByText('Accès réservé aux administrateurs')).toBeTruthy();
  });
});
