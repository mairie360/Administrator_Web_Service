import { expect, test } from '@playwright/test';
import { cookieHeader, signInAs, users } from './support/session';

// Critical journeys of the Administrator front (MAIR-603), on the real stack of
// docker-compose-e2e.yml (BFF User, Core API, seeded database): an administrator creates a user,
// gives them a role and deletes them (the account is archived, « Inactif » since V2, MAIR-824); an agent without the Admin role
// gets the "access reserved" screen and a 403 from BFF User. The texts asserted are the French
// ones displayed on screen.

const stamp = Date.now().toString(36);
const firstName = 'Agent';
const lastName = `E2E${stamp}`;
const fullName = `${firstName} ${lastName}`;
const email = `agent-e2e-${stamp}@mairie360.fr`;

test.describe('administrator', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.manager);
    await page.goto('/');
    await expect(page.getByRole('button', { name: 'Nouvel utilisateur' })).toBeVisible();
  });

  test('creates a user account', async ({ page }) => {
    await page.getByRole('button', { name: 'Nouvel utilisateur' }).click();
    const editor = page.getByRole('dialog', { name: 'Nouvel utilisateur' });
    await editor.getByLabel('Prénom', { exact: true }).fill(firstName);
    await editor.getByLabel('Nom', { exact: true }).fill(lastName);
    await editor.getByLabel('Adresse e-mail').fill(email);
    await editor.getByLabel('Mot de passe temporaire').fill('Parcours-E2E-2026!');
    await editor.getByRole('button', { name: 'Créer le compte' }).click();

    await expect(page.getByText(`Compte créé : ${fullName}`)).toBeVisible();
    await page.getByRole('searchbox', { name: 'Rechercher', exact: true }).fill(email);
    await expect(page.getByRole('row').filter({ hasText: email })).toBeVisible();
  });

  test('gives the user a role', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Rechercher', exact: true }).fill(email);
    const row = page.getByRole('row').filter({ hasText: email });
    await row.getByRole('button', { name: `Modifier ${fullName}` }).click();
    const editor = page.getByRole('dialog', { name: 'Modifier l’utilisateur' });
    await expect(editor).toBeVisible();

    await editor.locator('#edit-role').selectOption({ label: 'Responsable' });
    await editor.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(page.getByText(`Le compte de ${fullName} est à jour.`)).toBeVisible();
    await expect(row).toContainText('Responsable');
  });

  test('deletes the user account, which is archived', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Rechercher', exact: true }).fill(email);
    const row = page.getByRole('row').filter({ hasText: email });
    await row.getByRole('button', { name: `Supprimer ${fullName}` }).click();

    const confirm = page.getByRole('alertdialog', { name: 'Supprimer le compte ?' });
    await expect(confirm).toContainText(`« ${fullName} »`);
    await confirm.getByRole('button', { name: 'Supprimer', exact: true }).click();

    await expect(confirm).toBeHidden();
    await expect(page.getByText('Utilisateur supprimé')).toBeVisible();
    // Soft delete (Core API): the account is archived and stays listed as inactive (MAIR-904).
    await expect(row).toContainText('Inactif');
  });
});

test.describe('agent without the Admin role', () => {
  test('gets the access reserved screen without the console', async ({ page, context, baseURL }) => {
    await signInAs(context, baseURL!, users.member);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Accès réservé aux administrateurs' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Nouvel utilisateur' })).toHaveCount(0);
  });

  test('is refused by BFF User when listing the accounts directly', async ({ request }) => {
    const response = await request.get('/admin/users', {
      headers: { Cookie: cookieHeader(users.member), Accept: 'application/json' },
      maxRedirects: 0,
    });
    expect(response.status()).toBe(403);
  });
});

test('without a session, the console is not served', async ({ request }) => {
  const response = await request.get('/', { maxRedirects: 0 });
  expect(response.status()).toBe(307);
});
