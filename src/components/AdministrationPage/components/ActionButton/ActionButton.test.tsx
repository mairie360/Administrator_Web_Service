import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ActionButton } from './ActionButton';

describe('ActionButton', () => {
  it('maps each administration variant onto a lib button and shows busy as loading', () => {
    render(<><ActionButton variant="primary">Primaire</ActionButton><ActionButton variant="secondary">Secondaire</ActionButton><ActionButton variant="danger">Danger</ActionButton><ActionButton variant="dangerSolid">Plein</ActionButton><ActionButton variant="ghost" busy>Discret</ActionButton></>);
    for (const [label, variant, tone] of [['Primaire', 'solid', 'primary'], ['Secondaire', 'outline', 'neutral'], ['Danger', 'outline', 'danger'], ['Plein', 'solid', 'danger']]) {
      const button = screen.getByRole('button', { name: label });
      expect(button.getAttribute('data-variant')).toBe(variant); expect(button.getAttribute('data-tone')).toBe(tone);
    }
    const busy = screen.getByRole('button', { name: /Discret/ });
    expect((busy as HTMLButtonElement).disabled).toBe(true); expect(busy.getAttribute('aria-busy')).toBe('true');
  });
});
