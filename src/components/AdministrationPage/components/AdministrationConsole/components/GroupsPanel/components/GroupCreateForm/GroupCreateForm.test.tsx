import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { GroupCreateForm } from './GroupCreateForm';

describe('GroupCreateForm', () => {
  it('edits the name and creates', async () => {
    const onChange = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault());
    render(<GroupCreateForm form={{ name: '', description: '' }} saving={false} onChange={onChange} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/^Nom/), 'V'); expect(onChange).toHaveBeenCalledWith({ name: 'V', description: '' });
    fireEvent.submit(screen.getByRole('button', { name: 'Créer' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
