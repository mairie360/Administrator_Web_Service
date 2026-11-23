import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TwoFactorPolicyForm, sameTwoFactorPolicy, twoFactorPolicyError } from './TwoFactorPolicyForm';

const policy = { required: false, totp_allowed: true, passkey_allowed: true, backup_codes_allowed: false };

describe('TwoFactorPolicyForm', () => {
  it('compares and validates the policy', () => {
    expect(sameTwoFactorPolicy(policy, { ...policy })).toBe(true);
    expect(twoFactorPolicyError({ ...policy, totp_allowed: false, passkey_allowed: false })).toMatch(/au moins/);
  });

  it('shows the loading and unavailable states, Annuler gives back the saved policy', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<TwoFactorPolicyForm policy={null} state="unavailable" saving={false} onRetry={onRetry} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Réessayer/ })); expect(onRetry).toHaveBeenCalled();
    rerender(<TwoFactorPolicyForm policy={policy} state="default" saving={false} onRetry={onRetry} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Codes de secours' }));
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.getByText('Aucune modification à enregistrer.')).toBeTruthy();
  });
});
