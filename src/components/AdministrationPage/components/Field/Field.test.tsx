import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Field } from './Field';

describe('Field', () => {
  it('labels its control and shows the hint', () => {
    render(<Field label="Nom" htmlFor="name" hint="Obligatoire"><input id="name" /></Field>);
    expect(screen.getByLabelText(/Nom/)).toBeTruthy(); expect(screen.getByText('Obligatoire')).toBeTruthy();
  });
});
