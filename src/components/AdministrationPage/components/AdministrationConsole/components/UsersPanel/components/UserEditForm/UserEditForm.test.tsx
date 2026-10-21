import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };

import { UserEditForm } from './UserEditForm';

const form = { first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone_number: '', role_id: '9' } as never;

describe('UserEditForm', () => {
  it('offers the role choice, the save and the delete', async () => {
    const onDelete = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault());
    render(<UserEditForm form={form} roles={[role]} saving={false} deleting={false} onChange={vi.fn()} onDelete={onDelete} onSubmit={onSubmit} />);
    expect(screen.getByLabelText(/Rôle/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer l’utilisateur' })); expect(onDelete).toHaveBeenCalledTimes(1);
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
