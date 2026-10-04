const assert = require('node:assert/strict');
const { before, after, beforeEach, afterEach, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

installReactRuntime();
const React = require('react');
const bff = new ContractMockServer('BFF_USER', bffUserContract());
const role = (id) => ({ id, name: `Rôle ${id}`, description: `Description ${id}`, can_be_deleted: true });
let front;
let AdministrationConsole;
let view;

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ AdministrationConsole }] = loadTs(['src/components/administration-console.tsx']);
});
after(async () => { front.uninstall(); await bff.stop(); });
beforeEach(() => {
  global.window = { requestAnimationFrame: (callback) => callback() };
  global.document = { getElementById: () => ({ scrollIntoView() {} }) };
});
afterEach(() => {
  view?.unmount(); view = undefined;
  delete global.window; delete global.document;
  const violations = [...bff.violations, ...front.violations];
  bff.reset(); front.reset();
  assert.deepEqual(violations, []);
});

async function openRoles() {
  bff.on('get', '/bff/admin/roles', { body: { roles: [role(1), role(2)] } });
  bff.on('get', '/bff/admin/groups', { body: { groups: [] } });
  bff.on('get', '/bff/admin/sessions', { body: { sessions: [] } });
  bff.on('get', '/bff/admin/sessions/history', { body: { sessions: [] } });
  bff.on('get', '/bff/admin/users', { body: { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 } });
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.hostElements('Actualiser')[0]?.props.disabled === false);
  await view.click((props, text) => props.role === 'tab' && text === 'Rôles');
}
const startDeletion = async () => {
  await view.click('Supprimer');
};
const confirmDeletion = async () => {
  await view.act(() => view.props('ConfirmModal').onConfirm());
  await view.waitFor(() => view.props('ConfirmModal').open === false);
};

test('a confirmed role deletion remains reflected after a refused follow-up read; retry is GET only', async () => {
  await openRoles();
  bff.on('delete', '/bff/admin/roles/{roleId}', { status: 204 });
  bff.on('get', '/bff/admin/roles', bffError(503));
  await startDeletion(); await confirmDeletion();
  assert.match(view.text(), /Rôle supprimé/);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
  assert.doesNotMatch(view.text(), /Rôle 1/);
  assert.equal(bff.calls('/bff/admin/roles/{roleId}', 'DELETE').length, 1);
  bff.on('get', '/bff/admin/roles', { body: { roles: [role(2)] } });
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => !view.text().includes('Réessayer l’actualisation'));
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
  assert.equal(bff.calls('/bff/admin/roles/{roleId}', 'DELETE').length, 1);
});

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}
const field = (id) => view.hostElements((props) => props.id === id)[0].props;
const changeField = (id, value) => view.act(() => field(id).onChange({ target: { value } }));

test('pending and refused deletion preserve the role, modal and draft; a confirmed retry applies once', async () => {
  await openRoles();
  await view.click('Modifier');
  await changeField('role-name', 'Brouillon conservé');
  const write = deferred();
  bff.on('delete', '/bff/admin/roles/{roleId}', () => write.promise);
  await startDeletion();
  await view.act(() => {
    view.props('ConfirmModal').onConfirm();
    view.props('ConfirmModal').onConfirm();
  });
  await view.waitFor(() => bff.calls('/bff/admin/roles/{roleId}', 'DELETE').length === 1);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [1, 2]);
  assert.equal(view.props('ConfirmModal').busy, true);
  assert.equal(field('role-name').value, 'Brouillon conservé');
  write.resolve(bffError(403));
  await view.waitFor(() => view.props('ConfirmModal').busy === false);
  assert.equal(view.props('ConfirmModal').open, true);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [1, 2]);
  assert.equal(field('role-name').value, 'Brouillon conservé');
  assert.equal(bff.calls('/bff/admin/roles', 'GET').length, 1);
  bff.on('delete', '/bff/admin/roles/{roleId}', { status: 204 });
  bff.on('get', '/bff/admin/roles', bffError(503));
  await confirmDeletion();
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
  assert.equal(field('role-name').value, '');
  assert.equal(bff.calls('/bff/admin/roles/{roleId}', 'DELETE').length, 2);
});

test('the confirmed deletion is rendered before a delayed follow-up GET settles', async () => {
  await openRoles();
  const read = deferred();
  bff.on('delete', '/bff/admin/roles/{roleId}', { status: 204 });
  bff.on('get', '/bff/admin/roles', () => read.promise);
  await startDeletion();
  await view.act(() => view.props('ConfirmModal').onConfirm());
  await view.waitFor(() => bff.calls('/bff/admin/roles', 'GET').length === 2);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
  assert.equal(view.props('ConfirmModal').busy, true);
  read.resolve(bffError(503));
  await view.waitFor(() => view.props('ConfirmModal').open === false);
  assert.equal(bff.calls('/bff/admin/roles/{roleId}', 'DELETE').length, 1);
});

test('a global read started before the deletion cannot restore the confirmed removed role', async () => {
  await openRoles();
  const stale = deferred();
  let reads = 0;
  bff.on('get', '/bff/admin/roles', () => ++reads === 1 ? stale.promise : bffError(503));
  await view.click('Actualiser');
  await view.waitFor(() => bff.calls('/bff/admin/roles', 'GET').length === 2);
  bff.on('delete', '/bff/admin/roles/{roleId}', { status: 204 });
  await startDeletion(); await confirmDeletion();
  stale.resolve({ body: { roles: [role(1), role(2)] } });
  await view.waitFor(() => view.hostElements('Actualiser')[0]?.props.disabled === false);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
  assert.doesNotMatch(view.text(), /Rôle 1/);
});

test('deleting another role preserves an unrelated create draft', async () => {
  await openRoles();
  await changeField('role-name', 'Nouveau rôle non envoyé');
  await changeField('role-description', 'Description non envoyée');
  bff.on('delete', '/bff/admin/roles/{roleId}', { status: 204 });
  bff.on('get', '/bff/admin/roles', bffError(503));
  await startDeletion(); await confirmDeletion();
  assert.equal(field('role-name').value, 'Nouveau rôle non envoyé');
  assert.equal(field('role-description').value, 'Description non envoyée');
  assert.equal(bff.calls('/bff/admin/roles', 'POST').length, 0);
  assert.deepEqual(view.props('RolesPanel').roles.map((item) => item.id), [2]);
});
