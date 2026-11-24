import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupColorField } from './GroupColorField';

describe('GroupColorField', () => {
  it('MAIR-923: offers the charter palette after « Par défaut » and reports the choice', async () => {
    const onChange = vi.fn();
    render(<GroupColorField id="group-color" value={null} onChange={onChange} />);
    const select = screen.getByLabelText('Couleur') as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual(['Par défaut', 'Bleu', 'Turquoise', 'Vert', 'Orange', 'Violet', 'Rose', 'Neutre']);
    await userEvent.selectOptions(select, 'teal');
    expect(onChange).toHaveBeenCalledWith('teal');
    await userEvent.selectOptions(select, '');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});
