import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import { GroupEditForm } from './GroupEditForm';

describe('GroupEditForm', () => {
  it('shows the owner and saves the group', () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(<GroupEditForm form={{ name: 'Voirie', description: '' }} ownerLabel="Alice Dupont" saving={false} onChange={vi.fn()} onSubmit={onSubmit} />);
    expect(screen.getByDisplayValue('Voirie')).toBeTruthy(); expect(screen.getByText(/Alice Dupont/)).toBeTruthy();
    fireEvent.submit(screen.getByRole('button', { name: 'Enregistrer le groupe' }).closest('form')!); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
