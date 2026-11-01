import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { Panel } from './Panel';

describe('Panel', () => {
  it('renders the card title, description, action and content', () => {
    render(<Panel title="Utilisateurs" description="Sélectionnez une personne." action={<button type="button">Actualiser</button>}><p>Contenu</p></Panel>);
    expect(screen.getByRole('heading', { level: 2, name: 'Utilisateurs' })).toBeTruthy();
    expect(screen.getByText('Sélectionnez une personne.')).toBeTruthy(); expect(screen.getByRole('button', { name: 'Actualiser' })).toBeTruthy(); expect(screen.getByText('Contenu')).toBeTruthy();
  });
});
