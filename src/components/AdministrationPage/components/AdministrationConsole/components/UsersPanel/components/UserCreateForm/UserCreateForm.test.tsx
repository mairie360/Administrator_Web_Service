import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { UserCreateForm, emptyUserCreateDraft } from './UserCreateForm';

describe('UserCreateForm', () => {
  it('asks for the identity and the initial password, then creates', async () => {
    const onChange = vi.fn(); const onSubmit = vi.fn((event) => event.preventDefault()); const onCancel = vi.fn();
    render(<UserCreateForm form={emptyUserCreateDraft} saving={false} onChange={onChange} onCancel={onCancel} onSubmit={onSubmit} />);
    await userEvent.type(screen.getByLabelText(/Mot de passe initial/), 's'); expect(onChange).toHaveBeenCalledWith('password', 's');
    fireEvent.submit(screen.getByRole('button', { name: 'Créer' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
