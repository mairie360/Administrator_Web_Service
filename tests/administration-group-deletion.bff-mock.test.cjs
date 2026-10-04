const assert = require('node:assert/strict');
const { before, after, beforeEach, afterEach, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

installReactRuntime();
const React = require('react');
const bff = new ContractMockServer('BFF_USER', bffUserContract());
const group = (id) => ({ id, name: `Groupe ${id}`, description: `Description ${id}`, owner_id: 7 });
const emptyUsers = { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 };
let front;
let AdministrationConsole;
let administrationApi;
let getGroup;
let view;

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ AdministrationConsole }, { administrationApi }] = loadTs(['src/components/administration-console.tsx', 'src/lib/administration-api.ts']);
  getGroup = administrationApi.getGroup;
});
after(async () => { front.uninstall(); await bff.stop(); });
beforeEach(() => {
  global.window = { setTimeout, clearTimeout, requestAnimationFrame: (callback) => callback() };
});
afterEach(() => {
  administrationApi.getGroup = getGroup;
  view?.unmount(); view = undefined;
  delete global.window;
  const violations = [...bff.violations, ...front.violations];
  bff.reset(); front.reset();
  assert.deepEqual(violations, []);
});

async function openGroups() {
  bff.on('get', '/bff/admin/roles', { body: { roles: [] } });
  bff.on('get', '/bff/admin/groups', { body: { groups: [group(1), group(2)] } });
  bff.on('get', '/bff/admin/sessions', { body: { sessions: [] } });
  bff.on('get', '/bff/admin/sessions/history', { body: { sessions: [] } });
  bff.on('get', '/bff/admin/users', { body: emptyUsers });
  bff.on('get', '/bff/admin/groups/{groupId}', ({ pathParams }) => ({ body: { group: group(Number(pathParams.groupId)) } }));
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [] } });
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.hostElements('Actualiser')[0]?.props.disabled === false);
  await view.click((props, text) => props.role === 'tab' && text === 'Groupes');
}
async function selectGroup(id) {
  const count = bff.calls('/bff/admin/users', 'GET').length;
  await view.click((props, text, tag) => tag === 'button' && text.includes(`Groupe ${id}`) && text.includes('Ouvrir le groupe'));
  await view.waitFor(() => view.hostElements((props) => props.id === 'edit-group-name')[0]?.props.value === `Groupe ${id}`);
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length > count);
  await view.waitFor(() => !view.text().includes('Recherche des utilisateurs'));
}
async function startDeletion() { await view.click('Supprimer ce groupe'); }
async function confirmDeletion() {
  await view.act(() => view.props('ConfirmModal').onConfirm());
  await view.waitFor(() => view.props('ConfirmModal').open === false);
}
const ids = () => view.props('GroupsPanel').groups.map((item) => item.id);
const field = (id) => view.hostElements((props) => props.id === id)[0]?.props;
const changeField = (id, value) => view.act(() => field(id).onChange({ target: { value } }));
function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

test('a confirmed group deletion is reflected when its follow-up GET is refused; recovery never repeats DELETE', async () => {
  await openGroups(); await selectGroup(1);
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await startDeletion(); await confirmDeletion();
  assert.match(view.text(), /Groupe supprimé/);
  assert.deepEqual(ids(), [2]);
  assert.doesNotMatch(view.text(), /Groupe 1/);
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length, 1);
  bff.on('get', '/bff/admin/groups', { body: { groups: [group(2)] } });
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => !view.text().includes('Réessayer l’actualisation'));
  assert.deepEqual(ids(), [2]);
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length, 1);
});

test('pending and refused DELETE preserve selection, confirmation and drafts; repeated confirmation writes once', async () => {
  await openGroups(); await selectGroup(1);
  await changeField('edit-group-name', 'Brouillon du groupe');
  await changeField('group-name', 'Création indépendante');
  const write = deferred();
  bff.on('delete', '/bff/admin/groups/{groupId}', () => write.promise);
  await startDeletion();
  await view.act(() => {
    view.props('ConfirmModal').onConfirm();
    view.props('ConfirmModal').onConfirm();
  });
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length === 1);
  assert.deepEqual(ids(), [1, 2]);
  assert.equal(view.props('ConfirmModal').busy, true);
  assert.equal(field('edit-group-name').value, 'Brouillon du groupe');
  assert.equal(field('group-name').value, 'Création indépendante');
  write.resolve(bffError(403));
  await view.waitFor(() => view.props('ConfirmModal').busy === false);
  assert.equal(view.props('ConfirmModal').open, true);
  assert.deepEqual(ids(), [1, 2]);
  assert.equal(field('edit-group-name').value, 'Brouillon du groupe');
  assert.equal(bff.calls('/bff/admin/groups', 'GET').length, 1);
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await confirmDeletion();
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name'), undefined);
  assert.equal(field('group-name').value, 'Création indépendante');
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length, 2);
  assert.equal(bff.calls('/bff/admin/groups', 'POST').length, 0);
});

test('confirmed deletion removes the known group before a delayed follow-up GET settles', async () => {
  await openGroups(); await selectGroup(1);
  const read = deferred();
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', () => read.promise);
  await startDeletion();
  await view.act(() => view.props('ConfirmModal').onConfirm());
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'GET').length === 2);
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name'), undefined);
  assert.equal(view.props('ConfirmModal').busy, true);
  read.resolve(bffError(503));
  await view.waitFor(() => view.props('ConfirmModal').open === false);
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length, 1);
});

test('a global list GET started before DELETE cannot restore the confirmed removed group', async () => {
  await openGroups(); await selectGroup(1);
  const stale = deferred();
  let reads = 0;
  bff.on('get', '/bff/admin/groups', () => ++reads === 1 ? stale.promise : bffError(503));
  await view.click('Actualiser');
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'GET').length === 2);
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  await startDeletion(); await confirmDeletion();
  stale.resolve({ body: { groups: [group(1), group(2)] } });
  await view.waitFor(() => view.hostElements('Actualiser')[0]?.props.disabled === false);
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name'), undefined);
});

test('a late detail reply for the deleted group cannot reopen its editor', async () => {
  await openGroups(); await selectGroup(1);
  const detail = deferred();
  const consumed = deferred();
  // Observe completion of the real client/route/HTTP/contract path, not merely
  // that the test server has received the request.
  administrationApi.getGroup = async (id) => {
    const result = await getGroup(id);
    consumed.resolve();
    return result;
  };
  bff.on('get', '/bff/admin/groups/{groupId}', () => detail.promise);
  const open = view.hostElements((props, text, tag) => tag === 'button' && text.includes('Groupe 1') && text.includes('Ouvrir le groupe'))[0].props.onClick;
  const remove = view.hostElements('Supprimer ce groupe')[0].props.onClick;
  // Both real handlers can be queued before the loading render replaces the
  // detail controls; no hidden state or setter is used to manufacture this race.
  await view.act(() => { open(); remove(); });
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'GET').length === 2);
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await confirmDeletion();
  await view.act(async () => {
    detail.resolve({ body: { group: group(1) } });
    await consumed.promise;
  });
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name'), undefined);
  assert.doesNotMatch(view.text(), /Groupe 1/);
});

test('a newer other-group detail and its draft survive deleting the previous selection', async () => {
  await openGroups(); await selectGroup(1);
  const detail = deferred();
  bff.on('get', '/bff/admin/groups/{groupId}', () => detail.promise);
  const open = view.hostElements((props, text, tag) => tag === 'button' && text.includes('Groupe 2') && text.includes('Ouvrir le groupe'))[0].props.onClick;
  const remove = view.hostElements('Supprimer ce groupe')[0].props.onClick;
  await view.act(() => { open(); remove(); });
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'GET').length === 2);
  detail.resolve({ body: { group: group(2) } });
  await view.waitFor(() => field('edit-group-name')?.value === 'Groupe 2');
  await changeField('edit-group-name', 'Autre brouillon conservé');
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await confirmDeletion();
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name').value, 'Autre brouillon conservé');
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE')[0].pathParams.groupId, '1');
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length === 3);
  await view.waitFor(() => !view.text().includes('Recherche des utilisateurs'));
});

test('a pending other-group detail remains owned by its read after the previous group is deleted', async () => {
  await openGroups(); await selectGroup(1);
  const detail = deferred();
  bff.on('get', '/bff/admin/groups/{groupId}', () => detail.promise);
  const open = view.hostElements((props, text, tag) => tag === 'button' && text.includes('Groupe 2') && text.includes('Ouvrir le groupe'))[0].props.onClick;
  const remove = view.hostElements('Supprimer ce groupe')[0].props.onClick;
  await view.act(() => { open(); remove(); });
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'GET').length === 2);
  bff.on('delete', '/bff/admin/groups/{groupId}', { status: 204 });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await confirmDeletion();
  assert.deepEqual(ids(), [2]);
  assert.equal(field('edit-group-name'), undefined);
  detail.resolve({ body: { group: group(2) } });
  await view.waitFor(() => field('edit-group-name')?.value === 'Groupe 2');
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length === 3);
  await view.waitFor(() => !view.text().includes('Recherche des utilisateurs'));
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'DELETE').length, 1);
});
