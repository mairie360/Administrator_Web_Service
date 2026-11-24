import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserFields } from './UserFields';

const form = { first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone_number: '', serviceId: '' };

describe('UserFields', () => {
  it('renders the four identity fields with prefixed ids and reports edits', async () => {
    const onChange = vi.fn();
    render(<UserFields prefix="edit" form={form} services={[]} onChange={onChange} />);
    expect(document.getElementById('edit-first-name')).toBeTruthy(); expect(document.getElementById('edit-phone')).toBeTruthy();
    await userEvent.type(screen.getByLabelText(/Prénom/), 'x'); expect(onChange).toHaveBeenCalledWith('first_name', 'Alicex');
  });

  it('MAIR-923: offers the services of the mairie, « Aucun service » first', async () => {
    const onChange = vi.fn();
    render(<UserFields prefix="create" form={form} services={[{ id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 0 }]} onChange={onChange} />);
    const select = screen.getByLabelText(/^Service/) as HTMLSelectElement;
    expect([...select.options].map((option) => option.text)).toEqual(['Aucun service', 'Voirie']);
    await userEvent.selectOptions(select, '3');
    expect(onChange).toHaveBeenCalledWith('serviceId', '3');
  });
});
