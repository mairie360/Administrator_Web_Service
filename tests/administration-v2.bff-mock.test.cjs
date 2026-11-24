const assert = require('node:assert/strict');
const { test } = require('node:test');
const { bffError } = require('./support/bff-user-contract.cjs');
const { administrationDom } = require('./support/administration-dom.cjs');

// MAIR-824 (Administration V2): the real page on the published lib, the actual console hooks and the
// contract-gated BFF User mock, in a DOM (the lib tables and modals need real events). Each component
// keeps its own co-located Vitest test; this suite pins what goes through the BFF.

const twoFactor = { methods: [], last_verified_at: null };
const user = (id, first, last, extra = {}) => ({
  id, first_name: first, last_name: last, email: `user${id}@mairie.test`, phone_number: null, status: 'active', is_archived: false,
  roles: [{ id: 2, name: 'User' }], account_status: 'active', active_sessions: 0, last_login_at: null, two_factor: twoFactor, ...extra,
});
const admin = user(1, 'Alice', 'Dupont', { roles: [{ id: 1, name: 'Admin' }], active_sessions: 1 });
const bob = user(7, 'Bob', 'Martin', { active_sessions: 2 });
const carla = user(8, 'Carla', 'Petit', { account_status: 'suspended', status: 'suspended' });
const page = (users) => ({ users, page: 1, page_size: 6, total: users.length, total_pages: 1 });
const roles = [
  { id: 1, name: 'Admin', description: 'Administration', can_be_deleted: false },
  { id: 2, name: 'User', description: 'Agents', can_be_deleted: true },
  { id: 6, name: 'Stagiaire', description: 'Sans titulaire', can_be_deleted: true },
];
const session = (id) => ({ id, device_info: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0', ip_address: '192.0.2.4', created_at: '2026-11-20T08:00:00Z', expires_at: '2099-11-21T08:00:00Z', revoked_at: null });
const SID = '4f7c2a9e-8d31-4c55-9a0b-3e1f6d2c8b70';

const seed = (extra) => bff => {
  bff.on('get', '/admin/users', { body: page([admin, bob, carla]) }).on('get', '/admin/roles', { body: { roles } });
  extra?.(bff);
};
const requests = (bff) => bff.requests.map(({ method, url }) => `${method} ${url.pathname}${url.search}`);
const text = (dom) => dom.document.body.textContent;
const within = (dom, selector, label) => [...dom.document.querySelectorAll(`${selector} button`)].find(b => b.textContent.trim() === label);
const tab = (dom, label) => [...dom.document.querySelectorAll('[role="tab"]')].find(element => element.textContent.includes(label));
const row = (dom, name) => [...dom.document.querySelectorAll('tbody tr')].find(element => element.textContent.includes(name));

test('MAIR-885 the console reads users, roles and groups once, with V2 states and no sessions tab', async t => {
  const dom = await administrationDom(t, { configure: seed(), expected: 'Bob Martin' });
  assert.deepEqual(requests(dom.bff).filter(r => r.startsWith('GET /admin')).sort(), ['GET /admin/groups', 'GET /admin/roles', 'GET /admin/users?page=1&page_size=6']);
  assert.deepEqual([...dom.document.querySelectorAll('[role="tab"]')].map(element => element.textContent.trim()), ['Utilisateurs', 'Rôles', 'Groupes', 'Services', 'Sécurité']);
  assert.match(text(dom), /En ligne · 2 sessions/);
  assert.equal(row(dom, 'Carla Petit').querySelector('[data-status]').getAttribute('data-status'), 'suspended');
  // C7: an administrator cannot suspend or delete their own account from the list.
  assert.equal(dom.button('Suspendre Alice Dupont'), undefined); assert.equal(dom.button('Supprimer Alice Dupont'), undefined);
  assert.ok(dom.button('Suspendre Bob Martin')); assert.ok(dom.button('Réactiver Carla Petit'));
});

test('MAIR-904 suspension is confirmed first, then the row shows the suspended account without its sessions', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('post', '/admin/users/{userId}/suspend', { status: 204 })), expected: 'Bob Martin' });
  await dom.click(dom.button('Suspendre Bob Martin'));
  assert.equal(dom.bff.calls('/admin/users/{userId}/suspend', 'POST').length, 0, 'Nothing is written before the confirmation.');
  await dom.click(within(dom, '[role="alertdialog"]', 'Suspendre'));
  await dom.waitFor(() => row(dom, 'Bob Martin')?.querySelector('[data-status]').getAttribute('data-status') === 'suspended');
  assert.equal(dom.bff.calls('/admin/users/{userId}/suspend', 'POST').length, 1);
  assert.doesNotMatch(row(dom, 'Bob Martin').textContent, /En ligne/);
  assert.ok(dom.button('Réactiver Bob Martin'));
});

test('MAIR-904 a refused suspension keeps the account active and writes once', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('post', '/admin/users/{userId}/suspend', bffError(409))), expected: 'Bob Martin' });
  await dom.click(dom.button('Suspendre Bob Martin'));
  await dom.click(within(dom, '[role="alertdialog"]', 'Suspendre'));
  await dom.waitFor(() => dom.bff.calls('/admin/users/{userId}/suspend', 'POST').length === 1 && !within(dom, '[role="alertdialog"]', 'Suspendre')?.disabled);
  assert.equal(row(dom, 'Bob Martin').querySelector('[data-status]').getAttribute('data-status'), 'active');
  assert.equal(dom.bff.calls('/admin/users/{userId}/suspend', 'POST').length, 1);
});

test('MAIR-904 reactivation needs no confirmation and gives the account back', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('post', '/admin/users/{userId}/reactivate', { status: 204 })), expected: 'Carla Petit' });
  await dom.click(dom.button('Réactiver Carla Petit'));
  await dom.waitFor(() => row(dom, 'Carla Petit')?.querySelector('[data-status]').getAttribute('data-status') === 'active');
  assert.deepEqual(dom.bff.calls('/admin/users/{userId}/reactivate', 'POST').map(r => r.url.pathname), ['/admin/users/8/reactivate']);
});

test('MAIR-894 the user record reads the sessions of the account and signs one out after confirmation', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/users/{userId}/sessions', { body: { sessions: [session(SID)] } })
    .on('delete', '/admin/users/{userId}/sessions', { status: 204 })), expected: 'Bob Martin' });
  await dom.click(row(dom, 'Bob Martin'));
  await dom.waitFor(() => /Firefox/.test(dom.document.querySelector('[role="dialog"]')?.textContent ?? ''));
  assert.deepEqual(dom.bff.calls('/admin/users/{userId}/sessions', 'GET').map(r => r.url.pathname), ['/admin/users/7/sessions']);
  await dom.click(dom.button('Tout déconnecter'));
  assert.equal(dom.bff.calls('/admin/users/{userId}/sessions', 'DELETE').length, 0);
  await dom.click(within(dom, '[role="alertdialog"]', 'Tout déconnecter'));
  await dom.waitFor(() => dom.bff.calls('/admin/users/{userId}/sessions', 'DELETE').length === 1 && dom.bff.calls('/admin/users/{userId}/sessions', 'GET').length === 2);
});

test('MAIR-885 a refreshed list that is refused keeps the confirmed rows and says so', async t => {
  const dom = await administrationDom(t, { configure: seed(), expected: 'Bob Martin' });
  dom.bff.on('get', '/admin/users', bffError(503));
  await dom.click(dom.button('Actualiser'));
  await dom.waitFor(() => dom.bff.calls('/admin/users', 'GET').length === 2 && dom.document.querySelector('[role="alert"]') !== null);
  assert.ok(row(dom, 'Bob Martin'), 'The last confirmed rows stay on screen.');
  assert.deepEqual(requests(dom.bff).filter(r => r.startsWith('GET /admin')).sort(), [
    'GET /admin/groups', 'GET /admin/groups', 'GET /admin/roles', 'GET /admin/roles', 'GET /admin/users?page=1&page_size=6', 'GET /admin/users?page=1&page_size=6',
  ]);
});

test('MAIR-885 the search reads the first page of the matching accounts', async t => {
  const dom = await administrationDom(t, { configure: seed(), expected: 'Bob Martin' });
  const input = dom.document.getElementById('users-search');
  const React = require('react');
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(input, '  Bob ');
    input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await dom.waitFor(() => dom.bff.calls('/admin/users', 'GET').some(r => r.url.search.includes('search=Bob')));
  assert.equal(dom.bff.calls('/admin/users', 'GET').at(-1).url.search, '?page=1&page_size=6&search=Bob');
});

test('MAIR-916 a system role cannot be deleted, a held role warns with its holders, a free one is deleted after confirmation', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('delete', '/admin/roles/{roleId}', { status: 204 })), expected: 'Bob Martin' });
  await dom.click(tab(dom, 'Rôles'));
  await dom.waitFor(() => Boolean(dom.button('Supprimer Admin')));
  await dom.click(dom.button('Supprimer Admin'));
  assert.match(dom.document.querySelector('[role="alertdialog"]').textContent, /rôle système/);
  await dom.click(within(dom, '[role="alertdialog"]', 'Compris'));
  dom.bff.on('get', '/admin/users', { body: { users: [bob], page: 1, page_size: 1, total: 3, total_pages: 3 } });
  await dom.click(dom.button('Supprimer User'));
  await dom.waitFor(() => /attribué à 3 comptes/.test(dom.document.querySelector('[role="alertdialog"]')?.textContent ?? ''));
  assert.equal(dom.bff.calls('/admin/users', 'GET').at(-1).url.search, '?page=1&page_size=1&role_id=2');
  await dom.click(within(dom, '[role="alertdialog"]', 'Annuler'));
  dom.bff.on('get', '/admin/users', { body: { users: [], page: 1, page_size: 1, total: 0, total_pages: 0 } });
  await dom.click(dom.button('Supprimer Stagiaire'));
  await dom.waitFor(() => /définitivement supprimé/.test(dom.document.querySelector('[role="alertdialog"]')?.textContent ?? ''));
  await dom.click(within(dom, '[role="alertdialog"]', 'Supprimer'));
  await dom.waitFor(() => dom.bff.calls('/admin/roles/{roleId}', 'DELETE').length === 1);
  assert.deepEqual(dom.bff.calls('/admin/roles/{roleId}', 'DELETE').map(r => r.url.pathname), ['/admin/roles/6']);
});

test('MAIR-923 F21 the groups tab lists the projects left without a group', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('get', '/admin/projects-without-group', { body: { total: 1, projects: [{ id: 'project-9', title: 'Éclairage LED', createdAt: null }] } })), expected: 'Bob Martin' });
  await dom.click(tab(dom, 'Groupes'));
  await dom.waitFor(() => text(dom).includes('Éclairage LED'));
  assert.match(text(dom), /Projets sans groupe \(1\)/);
});

test('MAIR-824 the security tab saves the policy of the mairie and resets the factor of an agent', async t => {
  const policy = { required: false, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true, updated_by: null, updated_at: '2026-11-17T09:30:00Z' };
  const enrolled = { ...bob, two_factor: { methods: ['totp'], last_verified_at: '2026-11-20T08:00:00Z' } };
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/two-factor-policy', { body: policy })
    .on('put', '/admin/two-factor-policy', { body: { ...policy, required: true, updated_by: 1 } })
    .on('delete', '/admin/users/{userId}/2fa', { status: 204 })
    .on('get', '/admin/security-alerts', { body: [] })), expected: 'Bob Martin' });
  dom.bff.on('get', '/admin/users', { body: page([admin, enrolled]) });
  await dom.click(tab(dom, 'Sécurité'));
  await dom.waitFor(() => Boolean(dom.document.getElementById('two-factor-required')) && Boolean(dom.button('Réinitialiser la double authentification de Bob Martin')));
  assert.equal(dom.bff.calls('/admin/users', 'GET').at(-1).url.search, '?page=1&page_size=10&account_status=active');
  await dom.click(dom.document.getElementById('two-factor-required'));
  await dom.click(within(dom, '.administration-panel', 'Enregistrer'));
  await dom.waitFor(() => dom.bff.calls('/admin/two-factor-policy', 'PUT').length === 1);
  assert.deepEqual(dom.bff.calls('/admin/two-factor-policy', 'PUT')[0].body, { required: true, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true });
  await dom.click(dom.button('Réinitialiser la double authentification de Bob Martin'));
  await dom.click(within(dom, '[role="alertdialog"]', 'Réinitialiser'));
  await dom.waitFor(() => dom.bff.calls('/admin/users/{userId}/2fa', 'DELETE').length === 1);
  assert.equal(dom.bff.calls('/admin/users/{userId}/2fa', 'DELETE')[0].url.pathname, '/admin/users/7/2fa');
});

test('MAIR-773 the security tab lists the recent alerts and opens the journal of an agent, also from the e-mail link', async t => {
  const alert = { id: 12, level: 'certain', ip_address: '92.184.10.1', device_info: 'Mozilla/5.0 (X11; Linux x86_64) Firefox/140.0', created_at: '2026-11-23T08:12:00+00:00', acknowledged_at: null, user: { id: 7, first_name: 'Bob', last_name: 'Martin' } };
  const line = { action: 'STOLEN_SESSION_ATTEMPT', session_id: null, ip_address: '92.184.10.1', device_info: null, occurred_at: '2026-11-23T08:12:00+00:00' };
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/two-factor-policy', { body: { required: false, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true, updated_by: null, updated_at: '2026-11-17T09:30:00Z' } })
    .on('get', '/admin/security-alerts', { body: [alert] })
    .on('get', '/admin/users/{userId}/connection-logs', { body: [line] })), expected: 'Bob Martin' });
  await dom.click(tab(dom, 'Sécurité'));
  await dom.waitFor(() => text(dom).includes('Tentative certaine'));
  assert.match(text(dom), /92\.184\.xxx\.xxx/);
  assert.doesNotMatch(text(dom), /92\.184\.10\.1/);
  await dom.click(dom.button('Voir le journal des connexions de Bob Martin'));
  await dom.waitFor(() => text(dom).includes('Tentative de vol de session'));
  assert.match(text(dom), /Journal des connexions — Bob Martin/);
  assert.equal(dom.bff.calls('/admin/users/{userId}/connection-logs', 'GET')[0].url.pathname, '/admin/users/7/connection-logs');
  assert.match(dom.window.location.search, /journal=7/);
});

test('MAIR-923 a group opens in its panel: rename, add a member, remove one after confirmation, delete the group', async t => {
  const voirie = { id: 3, name: 'Voirie', description: 'Routes', owner_id: 1 };
  const member = ({ id, first_name, last_name, email }) => ({ id, first_name, last_name, email, phone_number: null, status: 'active', is_archived: false });
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/groups', { body: { groups: [voirie] } })
    .on('get', '/admin/groups/{groupId}', { body: { group: voirie } })
    .on('get', '/admin/groups/{groupId}/users', { body: { users: [member(admin), member(bob)] } })
    .on('patch', '/admin/groups/{groupId}', { body: { group: { ...voirie, name: 'Voirie et réseaux' } } })
    .on('post', '/admin/groups/{groupId}/users', { status: 204 })
    .on('delete', '/admin/groups/{groupId}/users/{userId}', { status: 204 })
    .on('delete', '/admin/groups/{groupId}', { status: 204 })), expected: 'Bob Martin' });
  await dom.click(tab(dom, 'Groupes'));
  await dom.waitFor(() => Boolean([...dom.document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.includes('Voirie'))));
  await dom.click([...dom.document.querySelectorAll('button[aria-pressed]')].find(b => b.textContent.includes('Voirie')));
  await dom.waitFor(() => /Membres \(2\)/.test(text(dom)) && /Carla Petit/.test(text(dom)));
  assert.doesNotMatch(dom.document.querySelector('#group-user-search').closest('div.border-t').textContent, /Bob Martin/, 'A member is not offered again.');

  const React = require('react');
  const type = async (element, value) => React.act(async () => {
    const prototype = element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await type(dom.document.getElementById('edit-group-name'), '  Voirie et réseaux ');
  await dom.click(dom.button('Enregistrer le groupe'));
  await dom.waitFor(() => dom.bff.calls('/admin/groups/{groupId}', 'PATCH').length === 1);
  assert.deepEqual(dom.bff.calls('/admin/groups/{groupId}', 'PATCH')[0].body, { name: 'Voirie et réseaux', description: 'Routes', color: null });

  const carlaRow = [...dom.document.querySelectorAll('div')].filter(d => d.textContent.includes('Carla Petit') && d.querySelectorAll('button').length === 1 && d.querySelector('button').textContent.trim() === 'Ajouter')
    .sort((a, b) => a.textContent.length - b.textContent.length)[0];
  dom.bff.on('get', '/admin/groups/{groupId}/users', { body: { users: [member(admin), member(bob), member(carla)] } });
  await dom.click(carlaRow.querySelector('button'));
  await dom.waitFor(() => dom.bff.calls('/admin/groups/{groupId}/users', 'POST').length === 1 && /Membres \(3\)/.test(text(dom)));
  assert.deepEqual(dom.bff.calls('/admin/groups/{groupId}/users', 'POST')[0].body, { group_id: 3, user_id: 8 });

  const bobRow = [...dom.document.querySelectorAll('div')].filter(d => d.textContent.includes('Bob Martin') && d.querySelectorAll('button').length === 1 && d.querySelector('button').textContent.trim() === 'Retirer')
    .sort((a, b) => a.textContent.length - b.textContent.length)[0];
  await dom.click(bobRow.querySelector('button'));
  assert.equal(dom.bff.calls('/admin/groups/{groupId}/users/{userId}', 'DELETE').length, 0);
  dom.bff.on('get', '/admin/groups/{groupId}/users', { body: { users: [member(admin), member(carla)] } });
  await dom.click(within(dom, '[role="alertdialog"]', 'Retirer du groupe'));
  await dom.waitFor(() => dom.bff.calls('/admin/groups/{groupId}/users/{userId}', 'DELETE').length === 1 && /Membres \(2\)/.test(text(dom)));
  assert.equal(dom.bff.calls('/admin/groups/{groupId}/users/{userId}', 'DELETE')[0].url.pathname, '/admin/groups/3/users/7');

  await dom.click(dom.button('Supprimer ce groupe'));
  await dom.click(within(dom, '[role="alertdialog"]', 'Supprimer'));
  await dom.waitFor(() => dom.bff.calls('/admin/groups/{groupId}', 'DELETE').length === 1);
  // Let the debounced member search (250 ms) and its read finish before the DOM is torn down.
  await React.act(async () => new Promise(resolve => setTimeout(resolve, 400)));
});

test('MAIR-923 the « Services » tab lists, creates, renames and deletes the services of the mairie', async t => {
  const voirie = { id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 2 };
  const culture = { id: 4, name: 'Culture', created_at: '2026-11-21T08:00:00Z', agents: 0 };
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/groups', { body: { groups: [] } })
    .on('get', '/admin/services', { body: { services: [voirie] } })
    .on('post', '/admin/services', { status: 201, body: culture })
    .on('patch', '/admin/services/{serviceId}', { body: { ...voirie, name: 'Voirie et réseaux' } })
    .on('delete', '/admin/services/{serviceId}', { status: 204 })), expected: 'Bob Martin' });
  const React = require('react');
  const type = async (element, value) => React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(element, value);
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });

  await dom.click(tab(dom, 'Services'));
  await dom.waitFor(() => /2 agents/.test(text(dom)));
  assert.ok(row(dom, 'Voirie'));

  dom.bff.on('get', '/admin/services', { body: { services: [culture, voirie] } });
  await dom.click(dom.button('Nouveau service'));
  await type(dom.document.getElementById('service-name'), '  Culture ');
  await dom.click(dom.button('Créer le service'));
  await dom.waitFor(() => dom.bff.calls('/admin/services', 'POST').length === 1 && Boolean(row(dom, 'Culture')));
  assert.deepEqual(dom.bff.calls('/admin/services', 'POST')[0].body, { name: 'Culture' });

  dom.bff.on('get', '/admin/services', { body: { services: [culture, { ...voirie, name: 'Voirie et réseaux' }] } });
  const labelled = (label) => [...dom.document.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label);
  await dom.click(labelled('Renommer le service Voirie'));
  await dom.waitFor(() => Boolean(dom.document.getElementById('service-name')));
  await type(dom.document.getElementById('service-name'), 'Voirie et réseaux');
  await dom.click(dom.button('Enregistrer'));
  await dom.waitFor(() => dom.bff.calls('/admin/services/{serviceId}', 'PATCH').length === 1);
  assert.deepEqual(dom.bff.calls('/admin/services/{serviceId}', 'PATCH')[0].body, { name: 'Voirie et réseaux' });
  assert.equal(dom.bff.calls('/admin/services/{serviceId}', 'PATCH')[0].url.pathname, '/admin/services/3');

  dom.bff.on('get', '/admin/services', { body: { services: [culture] } });
  await dom.waitFor(() => Boolean(labelled('Supprimer le service Voirie et réseaux')));
  await dom.click(labelled('Supprimer le service Voirie et réseaux'));
  assert.match(text(dom), /qui ne seront plus rattachés à aucun service/);
  await dom.click(within(dom, '[role="alertdialog"]', 'Supprimer'));
  await dom.waitFor(() => dom.bff.calls('/admin/services/{serviceId}', 'DELETE').length === 1);
  assert.equal(dom.bff.calls('/admin/services/{serviceId}', 'DELETE')[0].url.pathname, '/admin/services/3');
});
