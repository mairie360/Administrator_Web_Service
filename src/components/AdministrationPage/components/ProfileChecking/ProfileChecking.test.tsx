import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ProfileChecking } from './ProfileChecking';

describe('ProfileChecking', () => {
  it('names the page and announces the profile check', () => {
    render(<ProfileChecking />);
    expect(screen.getByRole('heading', { level: 1, name: 'Administration' })).toBeTruthy();
    expect(screen.getByText('Vérification du profil…')).toBeTruthy();
  });
});
