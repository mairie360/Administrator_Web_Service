const assert = require('node:assert/strict');
const { after, afterEach, before, beforeEach, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');

// HTML of the administration front rendered with react-dom/server against the mocked BFF User: the real
// page (src/app/page.tsx: shell with the session of GET /api/user/me) and the real administration console
// (src/components/administration-console.tsx, driven by src/lib/administration-api.ts) are rendered, the
// hook state is kept between render passes (tests/support/server-view.cjs), so the markup reflects what the
// BFF answered through the middleware and the contract-gated proxy.

const { router } = installReactRuntime();
const React = require('react');

const bff = new ContractMockServer('BFF_USER', bffUserContract());
let front;
let Home;
let AdministrationConsole;
let view;
let window;

function installWindow() {
  const store = new Map();
  window = {
    reloads: 0,
    localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: (key) => store.delete(key), clear: () => store.clear() },
    location: { reload: () => { window.reloads += 1; } },
  };
  global.window = window;
  return window;
}

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ default: Home }, { AdministrationConsole }] = loadTs(['src/app/page.tsx', 'src/components/administration-console.tsx']);
});
after(async () => {
  front.uninstall();
  await bff.stop();
});
beforeEach(() => {
  installWindow();
  router.reset();
});
afterEach(() => {
  view?.unmount();
  view = undefined;
  delete global.window;
  const violations = [...bff.violations, ...front.violations];
  bff.reset();
  front.reset();
  assert.deepEqual(violations, []);
});

const me = (user = {}, extra = {}) => ({
  user: { id: 1, first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone: '+33123456789', status: 'active', ...user },
  groups: [{ id: 1, name: 'Élus', owner_id: 1, description: null }],
  roles: [{ id: 1, name: 'Admin' }],
  ...extra,
});
const role = (id, extra = {}) => ({ id, name: `Rôle ${id}`, description: `Description ${id}`, can_be_deleted: true, ...extra });
const group = (id, extra = {}) => ({ id, name: `Groupe ${id}`, description: null, owner_id: 1, ...extra });
const member = (id, names = ['Alice', 'Dupont']) => ({ id, first_name: names[0], last_name: names[1], email: `user${id}@mairie.test`, phone_number: null, status: 'active', is_archived: false });
const user = (id, names) => ({ ...member(id, names), roles: [{ id: 1, name: 'Admin' }] });
const session = (id, extra = {}) => ({ id, device_info: `Firefox ${id}`, ip_address: '10.0.0.1', created_at: '2026-09-15T08:00:00Z', expires_at: '2026-09-16T08:00:00Z', revoked_at: null, ...extra });

const sequence = () => bff.requests.map(({ method, template }) => `${method} ${template}`).sort();

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
  return view.waitFor(() => bff.requests.length === 5 && !view.html.includes('aria-label="Chargement"') && view.find('UsersPanel')[0]?.props.onTotalChange && view.text().includes('Utilisateurs'));
}

test('the page shell renders the session resolved from GET /api/user/me around the administration module', async () => {
  bff.on('get', '/me', { body: me() });
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.equal(view.props('Header').user.name, 'Chargement…');
  assert.equal(view.find('AdministrationModule').length, 1);

  await view.waitFor(() => view.props('Header').user.name === 'Alice Dupont');

  assert.deepEqual(front.browserCalls, [{ method: 'GET', target: '/api/user/me' }]);
  assert.deepEqual(sequence(), ['GET /me']);
  assert.match(view.html, /<span[^>]*>Alice Dupont<\/span>/);
  assert.equal(view.props('Sidebar').isAdmin, true);
  assert.match(view.html, /aria-current="page"[^>]*>[\s\S]*?Administration/);
  assert.match(view.html, /<footer/);
  assert.doesNotMatch(view.html, /role="alert"/);
});

test('a session refused by BFF User logs the page out and reloads it', async () => {
  bff.on('get', '/me', bffError(401, 'Invalid or missing session token'));
  bff.on('post', '/auth/logout', { body: { message: 'Logged out successfully' }, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/; HttpOnly' } });
  view = mount(React.createElement(Home));

  await view.waitFor(() => window.reloads === 1);

  assert.deepEqual(sequence(), ['GET /me', 'POST /auth/logout']);
  assert.equal(view.props('Header').user.name, 'Chargement…');
});

test('the console loads roles, groups, sessions and users and renders the counts and the users table', async () => {
  mockConsoleData();
  view = mount(React.createElement(AdministrationConsole));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<h1[^>]*>Administration<\/h1>/);
  assert.match(view.html, /aria-label="Chargement"/);
  assert.match(view.text(), /— Utilisateurs 0 Rôles 0 Groupes 0 Sessions actives/);

  const html = await view.waitFor(() => bff.requests.length === 5 && !view.html.includes('aria-label="Chargement"') && view.text().includes('2 Utilisateurs'));

  assert.deepEqual(sequence(), ['GET /bff/admin/groups', 'GET /bff/admin/roles', 'GET /bff/admin/sessions', 'GET /bff/admin/sessions/history', 'GET /bff/admin/users']);
  assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
  assert.match(view.text(), /2 Utilisateurs 2 Rôles 1 Groupes 1 Sessions actives/);
  assert.match(html, /<button type="button" role="tab" aria-selected="true"[^>]*>[\s\S]*?Utilisateurs/);
  assert.match(html, /<th[^>]*>Utilisateur<\/th><th[^>]*>Contact<\/th><th[^>]*>Rôle<\/th><th[^>]*>Statut<\/th>/);
  assert.match(view.text(), /Alice Dupont/);
  assert.match(view.text(), /Bob Martin/);
  assert.match(view.text(), /user7@mairie\.test/);
  assert.match(view.text(), /Aucun téléphone/);
  assert.doesNotMatch(html, /role="alert"/);
});

test('the other tabs render the roles, groups and sessions of the BFF without reloading them', async () => {
  await renderLoadedConsole();

  await view.click((props, text, tag) => tag === 'button' && props.role === 'tab' && text.includes('Rôles'));
  assert.match(view.text(), /Rôle 1/);
  assert.match(view.text(), /Description 2/);

  await view.click((props, text, tag) => tag === 'button' && props.role === 'tab' && text.includes('Groupes'));
  assert.match(view.text(), /Groupe 1/);

  await view.click((props, text, tag) => tag === 'button' && props.role === 'tab' && text.includes('Sessions'));
  assert.match(view.html, /<th[^>]*>Appareil<\/th><th[^>]*>Adresse IP<\/th>/);
  assert.match(view.text(), /Firefox s-1/);
  assert.match(view.text(), /10\.0\.0\.1/);

  assert.equal(bff.requests.length, 5, 'switching tabs does not call the BFF again');
});

test('a 401 from the BFF is rendered as the administrator-session alert', async () => {
  for (const template of ['/bff/admin/roles', '/bff/admin/groups', '/bff/admin/sessions', '/bff/admin/sessions/history', '/bff/admin/users']) {
    bff.on('get', template, bffError(401, 'Invalid or missing session token'));
  }
  view = mount(React.createElement(AdministrationConsole));

  const html = await view.waitFor((current) => current.includes('Session administrateur requise'));

  assert.match(html, /<p[^>]*>Session administrateur requise<\/p>/);
  assert.match(view.text(), /Authentification requise\. Reconnectez-vous au portail Mairie360\./, 'the users panel reports its own 401');
  assert.match(view.text(), /Le BFF a répondu 401\./);
  assert.match(view.text(), /— Utilisateurs 0 Rôles 0 Groupes 0 Sessions actives/);
});

test('a partial failure keeps the data that loaded and lists the failed source', async () => {
  mockConsoleData();
  bff.on('get', '/bff/admin/roles', bffError(503, 'Core API unavailable'));
  view = mount(React.createElement(AdministrationConsole));

  const html = await view.waitFor((current) => current.includes('role="alert"') && view.text().includes('2 Utilisateurs'));

  assert.match(html, /<p[^>]*>Certaines données n’ont pas pu être chargées<\/p>/);
  assert.match(view.text(), /Erreur BFF \(503\)/);
  assert.match(view.text(), /0 Rôles 1 Groupes 1 Sessions actives/);
  assert.match(view.text(), /Alice Dupont/);
});

test('the refresh button reloads the four administration sources', async () => {
  await renderLoadedConsole();
  bff.on('get', '/bff/admin/roles', { body: { roles: [role(1), role(2), role(3)] } });

  await view.click('Actualiser');
  await view.waitFor(() => bff.requests.length === 9 && view.text().includes('3 Rôles'));

  assert.deepEqual(sequence().filter((line) => line.endsWith('/roles')), ['GET /bff/admin/roles', 'GET /bff/admin/roles']);
  assert.equal(bff.calls('/bff/admin/users').length, 1, 'the users list has its own loader');
});
