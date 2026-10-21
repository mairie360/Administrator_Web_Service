import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  it('asks the question in an alertdialog and confirms or cancels', async () => {
    const onCancel = vi.fn(); const onConfirm = vi.fn();
    const { rerender } = render(<ConfirmModal open={false} title="Supprimer ce rôle ?" description="Définitif." confirmLabel="Supprimer" onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.queryByRole('alertdialog')).toBeNull();
    rerender(<ConfirmModal open title="Supprimer ce rôle ?" description="Définitif." confirmLabel="Supprimer" onCancel={onCancel} onConfirm={onConfirm} />);
    expect(screen.getByRole('alertdialog', { name: 'Supprimer ce rôle ?' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer' })); expect(onConfirm).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole('button', { name: 'Fermer la confirmation' })); expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
