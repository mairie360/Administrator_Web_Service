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
const ACTIVE_READ = 'GET /admin/users?page=1&page_size=1&account_status=active';
const requests = (bff) => bff.requests.map(({ method, url }) => `${method} ${url.pathname}${url.search}`);
const text = (dom) => dom.document.body.textContent;
const within = (dom, selector, label) => [...dom.document.querySelectorAll(`${selector} button`)].find(b => b.textContent.trim() === label);
const tab = (dom, label) => [...dom.document.querySelectorAll('[role="tab"]')].find(element => element.textContent.includes(label));
const row = (dom, name) => [...dom.document.querySelectorAll('tbody tr')].find(element => element.textContent.includes(name));

test('MAIR-885 the console reads users, roles and groups once, with V2 states and no sessions tab', async t => {
  const dom = await administrationDom(t, { configure: seed(), expected: 'Bob Martin' });
  // The « N actifs » caption is the total of a one-row read of the active accounts.
  await dom.waitFor(() => requests(dom.bff).includes(ACTIVE_READ));
  assert.deepEqual(requests(dom.bff).filter(r => r.startsWith('GET /admin')).sort(), ['GET /admin/groups', 'GET /admin/roles', ACTIVE_READ, 'GET /admin/users?page=1&page_size=6']);
  assert.deepEqual([...dom.document.querySelectorAll('[role="tab"]')].map(element => element.textContent.trim()), ['Utilisateurs3', 'Rôles3', 'Groupes0']);
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
  await dom.waitFor(() => dom.bff.calls('/admin/users', 'GET').filter(r => r.url.search === '?page=1&page_size=6').length === 2 && dom.document.querySelector('[role="alert"]') !== null);
  assert.ok(row(dom, 'Bob Martin'), 'The last confirmed rows stay on screen.');
  assert.deepEqual(requests(dom.bff).filter(r => r.startsWith('GET /admin') && r !== ACTIVE_READ).sort(), [
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

// The console matches its artifact.
test('MAIR-1259 the « Services » and « Sécurité » tabs are gone, even from an old link', async t => {
  const dom = await administrationDom(t, { serverPage: true, configure: seed(), searchParams: { tab: 'security', journal: '7' }, expected: 'Bob Martin' });
  assert.deepEqual([...dom.document.querySelectorAll('[role="tab"]')].map(element => element.textContent.replace(/\d+$/, '').trim()), ['Utilisateurs', 'Rôles', 'Groupes']);
  assert.equal(dom.document.querySelector('[role="tab"][aria-selected="true"]').textContent.replace(/\d+$/, ''), 'Utilisateurs');
  assert.equal(dom.bff.calls('/admin/security-alerts').length + dom.bff.calls('/admin/two-factor-policy').length + dom.bff.calls('/admin/services').length, 0);
});

test('MAIR-1259 the counters read « ↗ N actifs » and the tabs carry their counts', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('get', '/admin/users', request => ({
    body: new URLSearchParams(request.url.search).get('account_status') === 'active' ? { users: [bob], page: 1, page_size: 1, total: 2, total_pages: 2 } : page([admin, bob, carla]),
  }))), expected: 'Bob Martin' });
  await dom.waitFor(() => /2 actifs/.test(dom.document.querySelector('[aria-pressed][aria-label^="Utilisateurs"]')?.textContent ?? ''));
  assert.equal(dom.document.querySelector('[aria-pressed][aria-label^="Utilisateurs"]').getAttribute('aria-label'), 'Utilisateurs 3 2 actifs');
  assert.ok(dom.button('Rôles 3 Modèles d’accès'));
  assert.deepEqual([...dom.document.querySelectorAll('[role="tab"]')].map(element => element.textContent.trim()), ['Utilisateurs3', 'Rôles3', 'Groupes0']);
  // The list stands in its frame, without the « Utilisateurs » panel title; the columns follow the mockup.
  assert.deepEqual([...dom.document.querySelectorAll('thead th')].map(cell => cell.textContent.trim()), ['Utilisateur', 'Rôle', 'Statut', 'Service', 'Dernière connexion', 'Actions']);
  assert.equal([...dom.document.querySelectorAll('h2, h3')].some(heading => heading.textContent.trim() === 'Utilisateurs'), false);
  assert.equal(row(dom, 'Alice Dupont').querySelector('[data-role="admin"]').textContent, 'Admin');
  assert.equal(row(dom, 'Bob Martin').querySelector('[data-role="admin"]'), null);
});

test('MAIR-1259 business journey: find an agent by service, narrow by role, open their record', async t => {
  const urbanisme = { id: 4, name: 'Urbanisme' };
  const dana = user(9, 'Dana', 'Roux', { service: urbanisme, roles: [{ id: 6, name: 'Stagiaire' }] });
  const eric = user(10, 'Éric', 'Morel', { service: urbanisme });
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/users', request => {
      const query = new URLSearchParams(request.url.search);
      if (query.get('account_status') === 'active') return { body: { users: [], page: 1, page_size: 1, total: 2, total_pages: 2 } };
      if (query.get('search') !== 'urba') return { body: page([admin, bob, carla]) };
      return { body: page(query.get('role_id') === '6' ? [dana] : [dana, eric]) };
    })
    .on('get', '/admin/users/{userId}/sessions', { body: { sessions: [] } })), expected: 'Bob Martin' });
  const React = require('react');
  // 1. The header search (« Rechercher un agent… ») takes the name of a service.
  const field = [...dom.document.querySelectorAll('header input')].find(input => input.placeholder === 'Rechercher un agent…');
  assert.ok(field, 'The header offers the agent search.');
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(field, 'urba');
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  await dom.waitFor(() => Boolean(row(dom, 'Éric Morel')) && !row(dom, 'Bob Martin'));
  assert.equal(dom.bff.calls('/admin/users', 'GET').at(-1).url.search, '?page=1&page_size=6&search=urba');
  assert.equal(dom.document.getElementById('users-search').value, 'urba', 'The list search shows the same terms.');
  assert.equal(dom.document.getElementById('users-search').placeholder, 'Nom, e-mail ou service');
  assert.match(row(dom, 'Dana Roux').textContent, /Urbanisme/);
  // 2. « Rôle : tous » narrows to one role.
  await dom.click(dom.button('Rôle : tous'));
  await dom.waitFor(() => Boolean([...dom.document.querySelectorAll('[role="menuitemradio"]')].find(item => item.textContent.includes('Stagiaire'))));
  await dom.click([...dom.document.querySelectorAll('[role="menuitemradio"]')].find(item => item.textContent.includes('Stagiaire')));
  await dom.waitFor(() => !row(dom, 'Éric Morel') && Boolean(row(dom, 'Dana Roux')));
  assert.equal(dom.bff.calls('/admin/users', 'GET').at(-1).url.search, '?page=1&page_size=6&search=urba&role_id=6');
  assert.ok(dom.button('Rôle : Stagiaire'));
  // 3. The row opens the record of the agent, with what the front relies on (name, service, sessions read).
  await dom.click(row(dom, 'Dana Roux'));
  await dom.waitFor(() => /Dana Roux/.test(dom.document.querySelector('[role="dialog"]')?.textContent ?? '') && dom.bff.calls('/admin/users/{userId}/sessions', 'GET').length === 1);
  assert.match(dom.document.querySelector('[role="dialog"]').textContent, /Urbanisme/);
  assert.equal(dom.bff.calls('/admin/users/{userId}/sessions', 'GET')[0].url.pathname, '/admin/users/9/sessions');
});

test('MAIR-1259 a suspension or a reactivation reads « N actifs » again', async t => {
  let active = 2;
  const dom = await administrationDom(t, { configure: seed(bff => bff
    .on('get', '/admin/users', request => new URLSearchParams(request.url.search).get('account_status') === 'active'
      ? { body: { users: [], page: 1, page_size: 1, total: active, total_pages: active } }
      : { body: page([admin, bob, carla]) })
    .on('post', '/admin/users/{userId}/suspend', () => { active = 1; return { status: 204 }; })
    .on('post', '/admin/users/{userId}/reactivate', () => { active = 2; return { status: 204 }; })), expected: 'Bob Martin' });
  const counter = () => dom.document.querySelector('[aria-pressed][aria-label^="Utilisateurs"]')?.getAttribute('aria-label') ?? '';
  await dom.waitFor(() => counter() === 'Utilisateurs 3 2 actifs');
  await dom.click(dom.button('Suspendre Bob Martin'));
  await dom.click(within(dom, '[role="alertdialog"]', 'Suspendre'));
  await dom.waitFor(() => counter() === 'Utilisateurs 3 1 actifs');
  await dom.click(dom.button('Réactiver Bob Martin'));
  await dom.waitFor(() => counter() === 'Utilisateurs 3 2 actifs');
  assert.equal(requests(dom.bff).filter(line => line === ACTIVE_READ).length >= 3, true, 'one active read per change of the active accounts');
});

test('MAIR-1259 a header search still waiting is dropped when another tab is chosen', async t => {
  const dom = await administrationDom(t, { configure: seed(bff => bff.on('get', '/admin/groups', { body: { groups: [] } })), expected: 'Bob Martin' });
  const React = require('react');
  const field = [...dom.document.querySelectorAll('header input')].find(input => input.placeholder === 'Rechercher un agent…');
  await React.act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(field, 'bob');
    field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  });
  // Before the 250 ms debounce runs out, the administrator opens « Rôles ».
  await dom.click(tab(dom, 'Rôles'));
  await new Promise(resolve => setTimeout(resolve, 400));
  await dom.waitFor(() => tab(dom, 'Rôles')?.getAttribute('aria-selected') === 'true');
  assert.equal(dom.bff.calls('/admin/users', 'GET').some(request => request.url.searchParams.has('search')), false, 'the waiting keystroke never searched');
  assert.equal(new URL(dom.window.location.href).searchParams.get('tab'), 'roles');
});
