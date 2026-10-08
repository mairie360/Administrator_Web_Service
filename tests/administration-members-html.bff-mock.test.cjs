const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// Real console interactions through the unmodified client, middleware and proxy,
// backed by HTTP fixtures validated against the published BFF User contract.

const { router } = installReactRuntime();
const React = require('react');

const bff = new ContractMockServer('BFF_USER', bffUserContract());
let front;
let AdministrationConsole;
let view;
let window;
const memberTimers = new Set();
const memberReads = new Set();

function installWindow() {
  const store = new Map();
  window = {
    reloads: 0,
    requestAnimationFrame: (callback) => callback(),
    localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: (key) => store.delete(key), clear: () => store.clear() },
    location: { reload: () => { window.reloads += 1; } },
  };
  global.window = window;
  return window;
}

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ AdministrationConsole }] = loadTs(['src/components/administration-console.tsx']);
});
after(async () => {
  front.uninstall();
  await bff.stop();
});
beforeEach(() => {
  installWindow();
  router.reset();
});
afterEach(async () => {
  for (const timer of memberTimers) clearTimeout(timer);
  memberTimers.clear();
  view?.unmount();
  view = undefined;
  await Promise.allSettled([...memberReads]);
  delete global.window;
  delete global.document;
  const violations = [...bff.violations, ...front.violations];
  bff.reset();
  front.reset();
  assert.deepEqual(violations, []);
});

const role = (id, extra = {}) => ({ id, name: `Rôle ${id}`, description: `Description ${id}`, can_be_deleted: true, ...extra });
const group = (id, extra = {}) => ({ id, name: `Groupe ${id}`, description: null, owner_id: 1, ...extra });
const member = (id, names = ['Alice', 'Dupont']) => ({ id, first_name: names[0], last_name: names[1], email: `user${id}@mairie.test`, phone_number: null, status: 'active', is_archived: false });
const user = (id, names) => ({ ...member(id, names), roles: [{ id: 1, name: 'Admin' }] });
const session = (id, extra = {}) => ({ id, device_info: `Firefox ${id}`, ip_address: '10.0.0.1', created_at: '2026-09-15T08:00:00Z', expires_at: '2026-09-16T08:00:00Z', revoked_at: null, ...extra });

// The "Actualiser" button is disabled while the console's own loadAll() (roles/groups/sessions/history) is
// in flight, independently of the active tab and of UsersPanel's own separate loading state. Waiting on it
// avoids a race where the users list (its own fetch) resolves before the other four sources.
const consoleLoaded = () => view.hostElements('Actualiser')[0]?.props.disabled === false;

function mockConsoleData({ roles = [role(1), role(2)], groups = [group(1)], active = [session('s-1')], history = [session('s-0', { revoked_at: '2026-09-14T08:00:00Z' })], users = [user(7), user(8, ['Bob', 'Martin'])] } = {}) {
  bff.on('get', '/bff/admin/roles', { body: { roles } });
  bff.on('get', '/bff/admin/groups', { body: { groups } });
  bff.on('get', '/bff/admin/sessions', { body: { sessions: active } });
  bff.on('get', '/bff/admin/sessions/history', { body: { sessions: history } });
  bff.on('get', '/bff/admin/users', { body: { users, page: 1, page_size: 20, total: users.length, total_pages: 1 } });
}

async function renderLoadedConsole(options) {
  mockConsoleData(options);
  view = mount(React.createElement(AdministrationConsole));
  return view.waitFor(() => bff.requests.length === 5 && consoleLoaded() && !view.html.includes('aria-label="Chargement"') && view.text().includes('Utilisateurs'));
}

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const changeField = (id, value) => view.fire(props => props.id === id, 'onChange', { target: { value } });
const openGroups = () => view.click((props, text) => props.role === 'tab' && text === 'Groupes');

const memberRows = () => view.hostElements(props => props.className === 'max-h-72 space-y-2 overflow-y-auto pr-1')[0]?.text ?? '';
const membershipWrites = () => bff.requests.filter(({ method, template }) => method !== 'GET' && template.includes('/groups/{groupId}/users'));
async function openMemberGroup(options = {}) {
  window.setTimeout = callback => {
    const timer = setTimeout(() => {
      memberTimers.delete(timer);
      const pending = Promise.resolve(callback()).finally(() => memberReads.delete(pending));
      memberReads.add(pending);
    }, 0);
    memberTimers.add(timer);
    return timer;
  };
  window.clearTimeout = timer => { clearTimeout(timer); memberTimers.delete(timer); };
  await renderLoadedConsole({ groups: [group(1), group(2)], users: [user(7), user(8, ['Bob', 'Martin']), user(9, ['Carol', 'Morel'])], ...options });
  bff.on('get', '/bff/admin/groups/{groupId}', ({ pathParams }) => ({ body: { group: group(Number(pathParams.groupId)) } }));
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [member(7), member(8, ['Bob', 'Martin'])] } });
  await openGroups();
  await view.click((_props, text, tag) => tag === 'button' && text.includes('Groupe 1') && text.includes('Ouvrir le groupe'));
  await view.waitFor(() => memberRows().includes('Bob Martin') && view.hostElements('Ajouter').some(({ type }) => type === 'button'));
}

for (const operation of ['add', 'remove']) {
  test(`a confirmed group member ${operation} remains visible after a refused read, and retry only reads`, async () => {
    await openMemberGroup();
    const method = operation === 'add' ? 'post' : 'delete';
    const route = operation === 'add' ? '/bff/admin/groups/{groupId}/users' : '/bff/admin/groups/{groupId}/users/{userId}';
    bff.on(method, route, { status: 204 });
    bff.on('get', '/bff/admin/groups/{groupId}/users', bffError(503));
    if (operation === 'add') await view.click('Ajouter');
    else {
      await view.click('Retirer');
      await view.act(() => view.props('ConfirmModal').onConfirm());
    }
    await view.waitFor(() => view.props('GroupsPanel').busyAction === null && view.text().includes('Ne répétez pas l’action'));
    const expected = operation === 'add'
      ? [member(7), member(8, ['Bob', 'Martin']), member(9, ['Carol', 'Morel'])]
      : [member(8, ['Bob', 'Martin'])];
    assert.match(memberRows(), /Bob Martin/);
    if (operation === 'add') {
      assert.match(memberRows(), /Carol Morel/);
      assert.equal(view.hostElements('Ajouter').filter(({ type }) => type === 'button').length, 0);
    } else {
      assert.doesNotMatch(memberRows(), /Alice Dupont/);
      assert.equal(view.props('ConfirmModal').open, false);
    }
    assert.match(view.text(), new RegExp(`Membres \\(${expected.length}\\)`));
    const writes = membershipWrites();
    assert.equal(writes.length, 1);
    bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: expected } });
    await view.click('Réessayer l’actualisation');
    await view.waitFor(() => view.props('GroupsPanel').busyAction === null && !view.text().includes('Ne répétez pas l’action'));
    assert.deepEqual(membershipWrites(), writes);
    assert.equal(bff.calls('/bff/admin/groups/{groupId}/users', 'GET').length, 3);
  });

  test(`a pending or refused group member ${operation} does not fabricate confirmation or duplicate writes`, async () => {
    await openMemberGroup();
    const method = operation === 'add' ? 'post' : 'delete';
    const route = operation === 'add' ? '/bff/admin/groups/{groupId}/users' : '/bff/admin/groups/{groupId}/users/{userId}';
    const pending = deferred();
    bff.on(method, route, () => pending.promise);
    let submit;
    if (operation === 'add') submit = view.hostElements('Ajouter').find(({ type }) => type === 'button').props.onClick;
    else {
      await view.click('Retirer');
      submit = view.props('ConfirmModal').onConfirm;
    }
    await view.act(() => { submit(); submit(); });
    await view.waitFor(() => membershipWrites().length === 1);
    assert.match(memberRows(), /Alice Dupont/);
    assert.doesNotMatch(memberRows(), /Carol Morel/);
    assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
    assert.ok(view.hostElements(props => props.role === 'tab').every(({ props }) => props.disabled));
    pending.resolve(bffError(403));
    await view.waitFor(() => view.props('GroupsPanel').busyAction === null);
    assert.match(memberRows(), /Alice Dupont/);
    assert.doesNotMatch(memberRows(), /Carol Morel/);
    assert.equal(view.props('ConfirmModal').open, operation === 'remove');
    assert.equal(bff.calls('/bff/admin/groups/{groupId}/users', 'GET').length, 1);
    assert.equal(membershipWrites().length, 1);
    assert.doesNotMatch(view.text(), /Ne répétez pas l’action/);
    bff.on(method, route, { status: 204 });
    bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: operation === 'add'
      ? [member(7), member(8, ['Bob', 'Martin']), member(9, ['Carol', 'Morel'])]
      : [member(8, ['Bob', 'Martin'])] } });
    await view.act(() => submit());
    await view.waitFor(() => membershipWrites().length === 2 && view.props('GroupsPanel').busyAction === null);
    if (operation === 'add') assert.match(memberRows(), /Carol Morel/);
    else {
      assert.doesNotMatch(memberRows(), /Alice Dupont/);
      assert.equal(view.props('ConfirmModal').open, false);
    }
  });

  test(`a confirmed group member ${operation} is applied before its delayed readback, with the console still locked`, async () => {
    await openMemberGroup();
    const route = operation === 'add' ? '/bff/admin/groups/{groupId}/users' : '/bff/admin/groups/{groupId}/users/{userId}';
    bff.on(operation === 'add' ? 'post' : 'delete', route, { status: 204 });
    const readback = deferred();
    bff.on('get', '/bff/admin/groups/{groupId}/users', () => readback.promise);
    if (operation === 'add') await view.click('Ajouter');
    else {
      await view.click('Retirer');
      await view.act(() => view.props('ConfirmModal').onConfirm());
    }
    await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}/users', 'GET').length === 2);
    if (operation === 'add') assert.match(memberRows(), /Carol Morel/);
    else assert.doesNotMatch(memberRows(), /Alice Dupont/);
    assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
    readback.resolve(bffError(503));
    await view.waitFor(() => view.props('GroupsPanel').busyAction === null && view.text().includes('Ne répétez pas l’action'));
    assert.equal(membershipWrites().length, 1);
  });
}

test('retrying a failed member refresh cannot put the previous group into a newly selected group or overwrite its draft', async () => {
  await openMemberGroup();
  bff.on('post', '/bff/admin/groups/{groupId}/users', { status: 204 });
  bff.on('get', '/bff/admin/groups/{groupId}/users', bffError(503));
  await view.click('Ajouter');
  await view.waitFor(() => view.props('GroupsPanel').busyAction === null && view.text().includes('Ne répétez pas l’action'));
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [member(10, ['David', 'Leroy'])] } });
  await view.click((_props, text, tag) => tag === 'button' && text.includes('Groupe 2') && text.includes('Ouvrir le groupe'));
  await view.waitFor(() => memberRows().includes('David Leroy'));
  await changeField('edit-group-name', 'Brouillon du groupe 2');
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [member(7), member(9, ['Carol', 'Morel'])] } });
  const reads = bff.calls('/bff/admin/groups/{groupId}/users', 'GET').length;
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => view.props('GroupsPanel').busyAction === null && !view.text().includes('Ne répétez pas l’action'));
  assert.match(memberRows(), /David Leroy/);
  assert.doesNotMatch(memberRows(), /Alice Dupont|Carol Morel/);
  assert.equal(bff.calls('/bff/admin/groups/{groupId}/users', 'GET').length, reads);
  assert.match(view.html, /id="edit-group-name"[^>]*value="Brouillon du groupe 2"/);
  assert.equal(membershipWrites().length, 1);
});

