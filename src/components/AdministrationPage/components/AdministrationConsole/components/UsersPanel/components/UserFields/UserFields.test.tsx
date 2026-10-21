import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserFields } from './UserFields';

const form = { first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone_number: '' };

describe('UserFields', () => {
  it('renders the four identity fields with prefixed ids and reports edits', async () => {
    const onChange = vi.fn();
    render(<UserFields prefix="edit" form={form} onChange={onChange} />);
    expect(document.getElementById('edit-first-name')).toBeTruthy(); expect(document.getElementById('edit-phone')).toBeTruthy();
    await userEvent.type(screen.getByLabelText(/Prénom/), 'x'); expect(onChange).toHaveBeenCalledWith('first_name', 'Alicex');
  });
});
