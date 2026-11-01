import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

import AdministrationMutationForm from './AdministrationMutationForm';

describe('AdministrationMutationForm', () => {
  it('renders a real form in the browser and submits through the handler only', () => {
    const onSubmit = vi.fn((event) => event.preventDefault());
    render(<AdministrationMutationForm onSubmit={onSubmit} role="search"><button type="submit">Rechercher</button></AdministrationMutationForm>);
    const form = screen.getByRole('search');
    expect(form.tagName).toBe('FORM'); fireEvent.submit(form); expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
