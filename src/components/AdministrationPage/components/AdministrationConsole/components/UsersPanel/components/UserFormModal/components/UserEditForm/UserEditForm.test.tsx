import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };

import { UserEditForm } from './UserEditForm';

const form = { first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone_number: '', serviceId: '', roleId: '9' };

describe('UserEditForm', () => {
  it('offers the role choice, the cancel and the save', async () => {
    const onCancel = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault());
    render(<UserEditForm form={form} roles={[role]} services={[]} saving={false} onChange={vi.fn()} onCancel={onCancel} onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/Rôle/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' })); expect(onCancel).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
