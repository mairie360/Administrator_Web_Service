import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

import { UserFormModal, emptyUserCreateDraft } from '.';

const props = () => ({ roles: [], services: [], createForm: emptyUserCreateDraft, editForm: { first_name: 'A', last_name: 'B', email: 'a@b.fr', phone_number: '', serviceId: '', roleId: '' },
  passwordForm: { password: '', confirmation: '' }, saving: false, resetting: false, warning: null, onCreateChange: vi.fn(), onEditChange: vi.fn(),
  onPasswordChange: vi.fn(), onCreate: vi.fn(), onUpdate: vi.fn(), onResetPassword: vi.fn(), onClose: vi.fn() });

describe('UserFormModal', () => {
  it('F06 / F09: « Nouvel utilisateur » and « Modifier l’utilisateur » in a modal, nothing when closed', () => {
    const { rerender, container } = render(<UserFormModal mode={null} {...props()} />);
    expect(container.textContent).toBe('');
    rerender(<UserFormModal mode="create" {...props()} />);
    expect(screen.getByRole('dialog', { name: 'Nouvel utilisateur' })).toBeTruthy();
    rerender(<UserFormModal mode="edit" name="A B" {...props()} warning={['Ajout du rôle non confirmé.']} />);
    expect(screen.getByRole('dialog', { name: 'Modifier l’utilisateur' })).toBeTruthy();
    expect(screen.getByText('Ajout du rôle non confirmé.')).toBeTruthy();
  });
});
