const assert = require('node:assert/strict');
const { test } = require('node:test');
const { administrationDom } = require('./support/administration-dom.cjs');
const bob = { id: 7, first_name: 'Bob', last_name: 'Martin', email: 'bob@mairie.test', phone_number: null, status: 'active', is_archived: false, roles: [] };
const page = users => ({ users, page: 1, page_size: 20, total: users.length, total_pages: users.length ? 1 : 0 });
function configure(bff) { bff.on('get', '/admin/users', { body: page([bob]) }); }
test('a confirmed SSR receipt survives real React StrictMode effect replay without any duplicate bootstrap', async t => {
  const dom = await administrationDom(t, { serverPage: true, strict: true, configure, expected: 'Bob Martin' });
  assert.equal(dom.bff.calls('/me', 'GET').length, 1);
  for (const path of ['/admin/users', '/admin/roles', '/admin/groups', '/admin/sessions', '/admin/sessions/history']) assert.equal(dom.bff.calls(path, 'GET').length, 1, path);
  assert.equal(dom.front.browserCalls.length, 0);
});
test('returning to Users after a confirmed deletion never resurrects the original SSR row', async t => {
  const dom = await administrationDom(t, { serverPage: true, configure, expected: 'Bob Martin' });
  dom.bff.on('delete', '/admin/users/{userId}', { status: 204 });
  await dom.click([...dom.document.querySelectorAll('tr')].find(row => row.textContent.includes('Bob Martin')));
  await dom.click(dom.button('Supprimer l’utilisateur'));
  dom.bff.on('get', '/admin/users', { body: page([]) });
  const confirm = [...dom.document.querySelectorAll('[role="alertdialog"] button')].find(button => button.textContent.trim() === 'Supprimer l’utilisateur');
  await dom.click(confirm);
  await dom.waitFor(() => dom.document.body.textContent.includes('Aucun utilisateur disponible.'));
  assert.ok(dom.document.body.textContent.includes('Aucun utilisateur disponible.'));
  const before = dom.bff.calls('/admin/users', 'GET').length;
  await dom.click([...dom.document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.trim().startsWith('Rôles')));
  await dom.click([...dom.document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.trim().startsWith('Utilisateurs')));
  await dom.waitFor(() => dom.bff.calls('/admin/users', 'GET').length > before);
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, before + 1);
  assert.ok(!dom.document.querySelector('tbody')?.textContent.includes('Bob Martin'));
});

test('changing the seeded users query and returning to its original URL performs fresh reads in both directions', async t => {
  const dom = await administrationDom(t, { serverPage: true, configure, expected: 'Bob Martin' });
  const React = require('react');
  dom.bff.on('get', '/admin/users', ({ url }) => ({ body: page(url.searchParams.get('search') === 'Alice' ? [{ ...bob, id: 8, first_name: 'Alice', last_name: 'Remplaçante' }] : [bob]) }));
  const navigate = async search => React.act(async () => {
    dom.window.history.pushState(dom.window.history.state, '', '/' + search);
    dom.window.dispatchEvent(new dom.window.PopStateEvent('popstate'));
  });
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 1);
  await navigate('?usersSearch=Alice');
  await dom.waitFor(() => dom.document.querySelector('tbody')?.textContent.includes('Alice Remplaçante'));
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 2);
  await navigate('');
  await dom.waitFor(() => dom.document.querySelector('tbody')?.textContent.includes('Bob Martin'));
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 3);
  assert.deepEqual(dom.bff.calls('/admin/users', 'GET').map(request => request.url.searchParams.get('search')), [null, 'Alice', null]);
});

test('the first Users visit after a confirmed role mutation reads the current role membership', async t => {
  const deletedRole = { id: 4, name: 'Rôle temporaire', description: 'À supprimer', can_be_deleted: true };
  const dom = await administrationDom(t, { serverPage: true, searchParams: { tab: 'roles' }, expected: 'Rôle temporaire', configure: bff => {
    bff.on('get', '/admin/users', { body: page([{ ...bob, roles: [{ id: 4, name: deletedRole.name }] }]) });
    bff.on('get', '/admin/roles', { body: { roles: [deletedRole] } });
  } });
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 1);
  dom.bff.on('delete', '/admin/roles/{roleId}', { status: 204 });
  await dom.click(dom.button('Supprimer'));
  dom.bff.on('get', '/admin/roles', { body: { roles: [] } });
  dom.bff.on('get', '/admin/users', { body: page([bob]) });
  await dom.click(dom.button('Supprimer le rôle'));
  await dom.waitFor(() => dom.document.body.textContent.includes('Rôle supprimé.'));
  await dom.click([...dom.document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.trim().startsWith('Utilisateurs')));
  await dom.waitFor(() => dom.document.querySelector('tbody')?.textContent.includes('Bob Martin'));
  assert.ok(!dom.document.querySelector('tbody').textContent.includes('Rôle temporaire'));
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 2);
});

for (const foreground of [false, true]) test(`an initial Roles tab never reuses its hidden users snapshot on the first Users visit${foreground ? ' after foreground recovery' : ''}`, async t => {
  const dom = await administrationDom(t, { serverPage: true, configure, searchParams: { tab: 'roles' }, expected: 'Créer un rôle' });
  dom.bff.on('get', '/admin/users', { body: page([{ ...bob, first_name: 'Alice', last_name: 'Distante' }]) });
  if (foreground) {
    await require('react').act(async () => dom.window.dispatchEvent(new dom.window.Event('focus')));
    await dom.waitFor(() => dom.bff.calls('/admin/roles', 'GET').length === 2 && !dom.button('Actualiser').disabled);
  }
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 1);
  await dom.click([...dom.document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.trim().startsWith('Utilisateurs')));
  assert.ok(!dom.document.querySelector('tbody')?.textContent.includes('Bob Martin'), 'An offscreen initial snapshot must never be displayed as the newly requested users page.');
  await dom.waitFor(() => dom.document.querySelector('tbody')?.textContent.includes('Alice Distante'));
  assert.equal(dom.bff.calls('/admin/users', 'GET').length, 2);
});

test('native administration forms use POST, including user creation, profile editing and password reset', async t => {
  const dom = await administrationDom(t, { serverPage: true, configure, expected: 'Bob Martin' });
  const postForms = () => {
    const forms = [...dom.document.querySelectorAll('main form')]; assert.ok(forms.length);
    for (const form of forms) assert.equal(form.method, 'post', 'Native submission must keep form values out of a GET URL.');
  };
  postForms();
  await dom.click(dom.button('Nouvel utilisateur')); postForms();
  assert.equal(dom.document.getElementById('create-password').form.method, 'post');
  await dom.click([...dom.document.querySelectorAll('tr')].find(row => row.textContent.includes('Bob Martin'))); postForms();
  assert.equal(dom.document.getElementById('edit-email').form.method, 'post');
  for (const label of ['Rôles', 'Groupes']) {
    await dom.click([...dom.document.querySelectorAll('[role="tab"]')].find(tab => tab.textContent.trim().startsWith(label)));
    postForms();
  }
});
