import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { RoleForm, roleFormDescription, roleFormTitle } from './RoleForm';

const form = { name: '', description: '', can_be_deleted: true } as never;

describe('RoleForm', () => {
  it('titles itself by mode and submits', () => {
    expect(roleFormTitle('create')).toBe('Créer un rôle'); expect(roleFormTitle('edit')).toBe('Modifier le rôle'); expect(roleFormDescription('create')).toBeTruthy();
    const onSubmit = vi.fn((event) => event.preventDefault());
    const { rerender } = render(<RoleForm mode="create" form={form} saving={false} onModeChange={vi.fn()} onChange={vi.fn()} onCancel={vi.fn()} onSubmit={onSubmit} />);
    fireEvent.submit(screen.getByRole('button', { name: 'Créer' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
    rerender(<RoleForm mode="edit" form={form} saving={false} onModeChange={vi.fn()} onChange={vi.fn()} onCancel={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeTruthy();
  });
});
