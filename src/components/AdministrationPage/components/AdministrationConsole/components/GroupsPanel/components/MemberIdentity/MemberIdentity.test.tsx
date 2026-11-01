import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { memberIdentity } from './MemberIdentity';

describe('memberIdentity', () => {
  it('renders the name and the e-mail of a member', () => {
    render(memberIdentity({ firstName: 'Alice', lastName: 'Dupont', email: 'alice@mairie.test' }));
    expect(screen.getByText(/Alice Dupont/)).toBeTruthy(); expect(screen.getByText('alice@mairie.test')).toBeTruthy();
  });
});
