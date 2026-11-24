import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ServiceModal, serviceNameError } from './ServiceModal';

const services = [{ id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 1 }];

describe('ServiceModal', () => {
  it('refuses an empty, taken (whatever its case) or marked-up name', () => {
    expect(serviceNameError('  ', services, null)).toBe('Indiquez un nom de service.');
    expect(serviceNameError('VOIRIE', services, null)).toBe('Un service porte déjà ce nom.');
    expect(serviceNameError('Voirie', services, 3)).toBeNull();
    expect(serviceNameError('<b>', services, null)).toBe('Le nom ne doit pas contenir les caractères < ou >.');
  });

  it('keeps the modal open with the error under the field', async () => {
    const onSave = vi.fn(async () => true);
    render(<ServiceModal target="new" services={services} saving={false} onClose={vi.fn()} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText(/Nom du service/), 'voirie');
    await userEvent.click(screen.getByRole('button', { name: 'Créer le service' }));
    expect(screen.getByText('Un service porte déjà ce nom.')).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });
});
