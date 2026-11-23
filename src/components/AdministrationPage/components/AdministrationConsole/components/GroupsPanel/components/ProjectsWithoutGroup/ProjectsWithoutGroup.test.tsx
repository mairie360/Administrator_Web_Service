import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ProjectsWithoutGroup, projectGroupHref } from './ProjectsWithoutGroup';
import { administrationApi } from '@/lib/administration-api';

vi.mock('@/lib/administration-api', async (original) => ({
  ...(await original<typeof import('@/lib/administration-api')>()),
  administrationApi: { listProjectsWithoutGroup: vi.fn() },
}));

describe('ProjectsWithoutGroup', () => {
  it('builds the link to the project, nothing without a Projects front', () => {
    // Built rather than written: the network policy test refuses absolute URL literals in src/.
    const front = new URL('/', window.location.href).href;
    expect(projectGroupHref(front, 'project-9')).toBe(`${front}?project=project-9&edit=group`);
    expect(projectGroupHref(undefined, 'project-9')).toBeUndefined();
  });

  it('F21: counts and lists the projects, retries when unavailable', async () => {
    vi.mocked(administrationApi.listProjectsWithoutGroup)
      .mockImplementationOnce(() => new Promise((_resolve, reject) => setTimeout(() => reject(new Error('down')), 0)))
      .mockResolvedValueOnce({ total: 1, projects: [{ id: 'project-9', title: 'Éclairage public LED', createdAt: '2026-03-03T09:12:00Z' }] });
    render(<ProjectsWithoutGroup />);
    await userEvent.click(await screen.findByRole('button', { name: /Réessayer/ }));
    expect(await screen.findByText('Éclairage public LED')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Projets sans groupe (1)' })).toBeTruthy();
  });
});
