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
  delete global.document;
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
  return view.waitFor(() => bff.requests.length === 5 && consoleLoaded() && !view.html.includes('aria-label="Chargement"') && view.find('UsersPanel')[0]?.props.onTotalChange && view.text().includes('Utilisateurs'));
}

test('the page shell renders the BFF-backed console with the resolved user session, never fixture administration', async () => {
  bff.on('get', '/me', { body: me() });
  mockConsoleData();
  view = mount(React.createElement(Home));

  assert.equal(view.passes, 1);
  assert.equal(view.props('Header').user.name, 'Chargement…');
  assert.equal(view.find('AdministrationConsole').length, 1);
  assert.equal(view.find('AdministrationModule').length, 0);
  assert.equal(view.find('AppShell').length, 1);
  assert.match(view.html, /<div class="min-w-0 w-full">/);
  assert.doesNotMatch(view.html, /max-w-\[1520px\]/);

  await view.waitFor(() => view.props('Header').user.name === 'Alice Dupont' && view.text().includes('2 Utilisateurs') && consoleLoaded());

  assert.deepEqual(sequence(), [
    'GET /bff/admin/groups',
    'GET /bff/admin/roles',
    'GET /bff/admin/sessions',
    'GET /bff/admin/sessions/history',
    'GET /bff/admin/users',
    'GET /me',
  ]);
  assert.match(view.html, /<span[^>]*>Alice Dupont<\/span>/);
  assert.match(view.text(), /2 Utilisateurs 2 Rôles 1 Groupes 1 Sessions actives/);
  assert.match(view.text(), /Bob Martin/);
  assert.equal(view.props('Sidebar').isAdmin, true);
  assert.match(view.html, /aria-current="page"[^>]*>[\s\S]*?Administration/);
  assert.match(view.html, /<footer/);
  const footer = view.html.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/)?.[0];
  assert.ok(footer);
  assert.match(view.html, /<aside\b[^]*?<footer\b[^]*?<\/footer>[^]*?<\/aside>/);
  assert.doesNotMatch(view.html, /<\/main>\s*<footer\b/);
  assert.match(footer.replace(/<[^>]*>/g, ''), new RegExp(`© ${new Date().getFullYear()} Mairie360`));
  assert.doesNotMatch(footer, /Version|<button\b|<a\b/);
  assert.doesNotMatch(view.html, /role="alert"/);
});

test('the users table contains its visually hidden action label without removing accessible text', async () => {
  await renderLoadedConsole();
  assert.match(view.html, /<th class="relative w-12 px-4 py-3">\s*<span class="sr-only">Modifier<\/span>/);
  assert.match(view.html, /overflow-x-auto rounded-lg border/);
  assert.match(view.html, /min-w-\[760px\]/);
  assert.match(view.text(), /Modifier/);
});

test('desktop and mobile navigation expose only active modules and keep Settings functional', async () => {
  const [{ setBrowserFrontUrls }] = loadTs(['src/lib/front-urls.ts']);
  const assigned = [];
  const originalAssign = global.window.location.assign;
  global.window.location.assign = (href) => assigned.push(href);
  setBrowserFrontUrls({
    DASHBOARD_FRONT_URL: 'https://dashboard.test.example/',
    PROJECT_FRONT_URL: 'https://projects.test.example/',
    MESSAGE_FRONT_URL: 'https://messages.test.example/',
    ELEARNING_FRONT_URL: 'https://training.test.example/',
    CALENDAR_FRONT_URL: 'https://calendar.test.example/',
    ADMINISTRATION_FRONT_URL: 'https://admin.test.example/',
    SETTINGS_FRONT_URL: 'https://settings.test.example/',
  });
  try {
    bff.on('get', '/me', { body: me() });
    mockConsoleData();
    view = mount(React.createElement(Home));
    await view.waitFor(() => view.props('Header').user.name === 'Alice Dupont' && consoleLoaded());
    assert.equal(view.props('AppShell').activeItem, 'admin');
    assert.equal(view.props('AppShell').hrefs.profile, 'https://settings.test.example/');
    const isAdmin = view.props('Sidebar').isAdmin;
    for (const mobileOpen of [false, true]) {
      await view.act(() => view.props('Header').setSidebarOpen(mobileOpen));
      const sidebars = view.find('Sidebar');
      assert.equal(sidebars.length, mobileOpen ? 2 : 1);
      for (const { props } of sidebars) {
        assert.deepEqual(props.items.map(item => item.id),
          ['dashboard', 'projects', 'messages', 'training', 'calendar', 'admin', 'settings']);
        assert.equal(props.items.find(item => item.id === 'admin').adminOnly, true);
        assert.equal(props.isAdmin, isAdmin);
        assert.equal(props.activeItem, 'admin');
      }
      const menus = view.html.match(/<nav\b[^>]*aria-label="Menu principal"[^>]*>[\s\S]*?<\/nav>/g) ?? [];
      assert.equal(menus.length, sidebars.length);
      for (const menu of menus) {
        assert.doesNotMatch(menu, /E-mails|Fichiers/);
        assert.match(menu, /Paramètres/);
        assert.equal(menu.includes('>Administration<'), isAdmin);
      }
    }
    const mobileSidebar = view.find('Sidebar')[1].props;
    await view.act(() => mobileSidebar.onItemSelect(mobileSidebar.items.find(item => item.id === 'settings')));
    assert.deepEqual(assigned, ['https://settings.test.example/']);
    assert.equal(view.find('Sidebar').length, 1);
  } finally {
    setBrowserFrontUrls({});
    global.window.location.assign = originalAssign;
  }
});

test('a session refused by BFF User logs the page out and reloads it', async () => {
  bff.on('get', '/me', bffError(401, 'Invalid or missing session token'));
  for (const template of ['/bff/admin/roles', '/bff/admin/groups', '/bff/admin/sessions', '/bff/admin/sessions/history', '/bff/admin/users']) {
    bff.on('get', template, bffError(401, 'Invalid or missing session token'));
  }
  bff.on('post', '/auth/logout', { body: { message: 'Logged out successfully' }, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/; HttpOnly' } });
  view = mount(React.createElement(Home));

  await view.waitFor(() => window.reloads === 1);

  assert.deepEqual(sequence().filter((request) => request === 'GET /me' || request === 'POST /auth/logout'), ['GET /me', 'POST /auth/logout']);
  assert.equal(view.props('Header').user.name, 'Chargement…');
});

test('the console loads roles, groups, sessions and users and renders the counts and the users table', async () => {
  mockConsoleData();
  view = mount(React.createElement(AdministrationConsole));

  assert.equal(view.passes, 1);
  assert.match(view.html, /<h1[^>]*>Administration<\/h1>/);
  assert.match(view.html, /aria-label="Chargement"/);
  assert.match(view.text(), /— Utilisateurs 0 Rôles 0 Groupes 0 Sessions actives/);

  const html = await view.waitFor(() => bff.requests.length === 5 && consoleLoaded() && !view.html.includes('aria-label="Chargement"') && view.text().includes('2 Utilisateurs'));

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

test('session history distinguishes expiration, revocation and unknown expiry without additional requests', async () => {
  await renderLoadedConsole({ history: [
    session('expired', { expires_at: '2020-01-01T00:00:00Z' }),
    session('revoked', { expires_at: '2020-01-01T00:00:00Z', revoked_at: '2020-01-01T00:00:00Z' }),
    session('active', { expires_at: '2100-01-01T00:00:00Z' }),
    session('unknown', { expires_at: 'invalid' }),
  ] });
  await view.click((props, text, tag) => tag === 'button' && props.role === 'tab' && text.includes('Sessions'));
  await view.click((props, text, tag) => tag === 'button' && text.includes('Historique'));
  const rows = view.html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
  for (const [id, label] of [['expired', 'Expirée'], ['revoked', 'Révoquée'], ['active', 'Active'], ['unknown', 'État indéterminé']]) {
    assert.ok(rows.some(row => row.includes(`Firefox ${id}`) && row.includes(label)));
  }
  assert.equal(bff.requests.length, 5);
});

test('long group names stay complete in the scoped responsive console and detail panel', async () => {
  const longName = 'Recette'.repeat(9); // 63 characters: within the existing group contract.
  await renderLoadedConsole({ groups: [group(1, { name: longName })] });
  bff.on('get', '/bff/admin/groups/{groupId}', { body: { group: group(1, { name: longName }) } });
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [] } });

  await view.click((props, text, tag) => tag === 'button' && props.role === 'tab' && text.includes('Groupes'));
  await view.click((props, text, tag) => tag === 'button' && text.includes(longName));
  await view.waitFor(() => view.html.includes('id="edit-group-name"'));

  assert.match(view.html, /<section class="administration-console min-w-0 /);
  assert.match(view.html, /<section class="administration-panel min-w-0 /);
  assert.match(view.html, /<button[^>]*class="inline-flex h-10 shrink-0 /);
  assert.match(view.html, /<span class="shrink-0 font-mono text-xs [^"]*">#1<\/span>/);
  assert.match(view.html, new RegExp(`<h2[^>]*>${longName}</h2>`));
  assert.match(view.html, new RegExp(`id="edit-group-name"[^>]*value="${longName}"`));
  assert.ok(view.text().includes('Enregistrer le groupe'));
  assert.deepEqual(sequence(), [
    'GET /bff/admin/groups', 'GET /bff/admin/groups/{groupId}',
    'GET /bff/admin/groups/{groupId}/users', 'GET /bff/admin/roles',
    'GET /bff/admin/sessions', 'GET /bff/admin/sessions/history', 'GET /bff/admin/users',
  ]);
});

test('a 401 from the BFF is rendered as the administrator-session alert', async () => {
  for (const template of ['/bff/admin/roles', '/bff/admin/groups', '/bff/admin/sessions', '/bff/admin/sessions/history', '/bff/admin/users']) {
    bff.on('get', template, bffError(401, 'Invalid or missing session token'));
  }
  view = mount(React.createElement(AdministrationConsole));

  const html = await view.waitFor((current) => current.includes('Session administrateur requise'));

  assert.match(html, /<p[^>]*>Session administrateur requise<\/p>/);
  assert.match(view.text(), /Authentification requise\. Reconnectez-vous au portail Mairie360\./, 'the users panel reports its own 401');
  assert.match(view.text(), /Votre session a expiré\. Reconnectez-vous pour accéder à l’administration\./);
  assert.match(view.text(), /— Utilisateurs 0 Rôles 0 Groupes 0 Sessions actives/);
});

test('a partial failure keeps the data that loaded and lists the failed source', async () => {
  mockConsoleData();
  bff.on('get', '/bff/admin/roles', bffError(503, 'Core API unavailable'));
  view = mount(React.createElement(AdministrationConsole));

  const html = await view.waitFor((current) => current.includes('role="alert"') && view.text().includes('2 Utilisateurs'));

  assert.match(html, /<p[^>]*>Certaines données n’ont pas pu être chargées<\/p>/);
  assert.match(view.text(), /Le service d’administration est momentanément indisponible\. Réessayez plus tard\./);
  assert.doesNotMatch(view.text(), /Erreur BFF|Core API unavailable|\b503\b/);
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

const deferred = () => {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
};
const changeField = (id, value) => view.fire(props => props.id === id, 'onChange', { target: { value } });
const groupForm = () => view.hostElements((props, _text, tag) => tag === 'form' && props.className?.includes('sm:items-end'))[0];
const editGroupForm = () => view.hostElements((props, _text, tag) => tag === 'form' && props.className === 'space-y-4')[0];
const openGroups = () => view.click((props, text) => props.role === 'tab' && text === 'Groupes');

test('a delayed initial console read cannot erase a group confirmed by a later creation', async () => {
  mockConsoleData();
  const initialRoles = deferred();
  bff.on('get', '/bff/admin/roles', () => initialRoles.promise);
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.text().includes('2 Utilisateurs'));
  await openGroups();
  await changeField('group-name', 'Groupe confirmé');
  bff.on('post', '/bff/admin/groups', { status: 201, body: { group: group(2, { name: 'Groupe confirmé' }) } });
  bff.on('get', '/bff/admin/groups', { body: { groups: [group(1), group(2, { name: 'Groupe confirmé' })] } });
  await view.act(() => groupForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.text(), /Groupe confirmé/);
  initialRoles.resolve({ body: { roles: [role(1), role(2)] } });
  await view.waitFor(consoleLoaded);
  assert.match(view.text(), /Groupe confirmé/);
  assert.equal(bff.calls('/bff/admin/groups', 'POST').length, 1);
});

test('a targeted roles refresh supersedes only roles while a global read is delayed', async () => {
  mockConsoleData();
  const initialGroups = deferred();
  bff.on('get', '/bff/admin/groups', () => initialGroups.promise);
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.text().includes('2 Utilisateurs'));
  await view.click((props, text) => props.role === 'tab' && text === 'Rôles');
  bff.on('get', '/bff/admin/roles', { body: { roles: [role(3, { name: 'Rôle confirmé' })] } });
  await view.act(() => view.props('RolesPanel').refreshRoles());
  initialGroups.resolve({ body: { groups: [group(1), group(2)] } });
  await view.waitFor(consoleLoaded);
  assert.deepEqual(view.props('RolesPanel').roles.map(item => item.id), [3]);
  assert.match(view.text(), /1 Rôles 2 Groupes 1 Sessions actives/);
  assert.equal(bff.calls('/bff/admin/roles', 'GET').length, 2);
});

test('a targeted sessions refresh preserves both current and history against a delayed global read', async () => {
  mockConsoleData();
  const initialGroups = deferred();
  bff.on('get', '/bff/admin/groups', () => initialGroups.promise);
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.text().includes('2 Utilisateurs'));
  await view.click((props, text) => props.role === 'tab' && text === 'Sessions');
  bff.on('get', '/bff/admin/sessions', { body: { sessions: [] } });
  bff.on('get', '/bff/admin/sessions/history', { body: { sessions: [session('confirmed-revoked', { revoked_at: '2026-09-15T08:00:00Z' })] } });
  await view.act(() => view.props('SessionsPanel').refreshSessions());
  initialGroups.resolve({ body: { groups: [group(1)] } });
  await view.waitFor(consoleLoaded);
  assert.deepEqual(view.props('SessionsPanel').activeSessions, []);
  assert.deepEqual(view.props('SessionsPanel').sessionHistory.map(item => item.id), ['confirmed-revoked']);
  assert.match(view.text(), /0 Sessions actives/);
});

test('obsolete resource failures cannot hide newer data or suppress an independent current failure', async () => {
  mockConsoleData();
  const initialRoles = deferred();
  bff.on('get', '/bff/admin/roles', () => initialRoles.promise);
  bff.on('get', '/bff/admin/groups', bffError(401));
  bff.on('get', '/bff/admin/sessions/history', bffError(503));
  view = mount(React.createElement(AdministrationConsole));
  await view.waitFor(() => bff.requests.length === 5 && view.text().includes('2 Utilisateurs'));
  await openGroups();
  bff.on('get', '/bff/admin/groups', { body: { groups: [group(2, { name: 'Groupe confirmé' })] } });
  await view.act(() => view.props('GroupsPanel').refreshGroups());
  initialRoles.resolve({ body: { roles: [role(1)] } });
  await view.waitFor(consoleLoaded);
  assert.match(view.text(), /Groupe confirmé/);
  assert.match(view.text(), /Certaines données n’ont pas pu être chargées/);
  assert.match(view.text(), /momentanément indisponible/);
  assert.doesNotMatch(view.text(), /Session administrateur requise/);
});

test('an older global read cannot overwrite a newer global read or its loading and error state', async () => {
  await renderLoadedConsole();
  const older = deferred();
  const consumed = deferred();
  const [{ administrationApi }] = loadTs(['src/lib/administration-api.ts']);
  const originalListRoles = administrationApi.listRoles;
  administrationApi.listRoles = async () => {
    try { return await originalListRoles(); }
    finally { consumed.resolve(); }
  };
  const reload = view.hostElements('Actualiser')[0].props.onClick;
  bff.on('get', '/bff/admin/roles', () => older.promise);
  try {
    await view.act(() => reload());
    await view.waitFor(() => bff.calls('/bff/admin/roles', 'GET').length === 2);
  } finally {
    administrationApi.listRoles = originalListRoles;
  }
  bff.on('get', '/bff/admin/roles', { body: { roles: [role(3)] } });
  await view.act(() => reload());
  await view.waitFor(() => bff.calls('/bff/admin/roles', 'GET').length === 3 && consoleLoaded());
  const settledPasses = view.passes;
  older.resolve(bffError(401));
  await consumed.promise;
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(view.passes, settledPasses);
  assert.match(view.text(), /1 Rôles/);
  assert.doesNotMatch(view.text(), /Session administrateur requise/);
  assert.equal(consoleLoaded(), true);
});

test('targeted reads finishing after unmount do not commit or propagate stale failures', async () => {
  await renderLoadedConsole();
  await openGroups();
  const older = deferred();
  bff.on('get', '/bff/admin/groups', () => older.promise);
  const pending = view.props('GroupsPanel').refreshGroups();
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'GET').length === 2);
  view.unmount();
  older.resolve(bffError(503));
  await assert.doesNotReject(pending);
  view = undefined;
});

test('group creation is synchronous-single-flight and locks fields, selection and tabs until refresh finishes', async () => {
  await renderLoadedConsole();
  await openGroups();
  await changeField('group-name', 'Équipe');
  await changeField('group-description', 'Description');
  const write = deferred();
  const reload = deferred();
  bff.on('post', '/bff/admin/groups', () => write.promise);
  bff.on('get', '/bff/admin/groups', () => reload.promise);
  const submitted = groupForm().props.onSubmit;
  const first = view.act(() => submitted({ preventDefault() {} }));
  const repeated = view.act(() => submitted({ preventDefault() {} }));
  await repeated;
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'POST').length === 1);
  assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
  assert.ok(view.hostElements(props => props.role === 'tab').every(({ props }) => props.disabled));
  assert.equal(view.hostElements('Créer').find(({ type }) => type === 'button').props.disabled, true);
  assert.equal(await view.props('GroupsPanel').runAction('other', 'Ignored', () => assert.fail('concurrent action ran')), false);
  write.resolve({ status: 201, body: { group: group(2, { name: 'Équipe', description: 'Description' }) } });
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'GET').length === 2);
  assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
  reload.resolve({ body: { groups: [group(1), group(2, { name: 'Équipe', description: 'Description' })] } });
  await first;
  assert.match(view.html, /id="group-name"[^>]*value=""/);
  assert.match(view.html, /<fieldset aria-busy="false"/);
  assert.match(view.text(), /Groupe créé/);
  assert.equal(bff.calls('/bff/admin/groups', 'POST').length, 1);
});

test('refused group creation retains both fields and enables an explicit successful retry', async () => {
  await renderLoadedConsole();
  await openGroups();
  await changeField('group-name', 'Équipe conservée');
  await changeField('group-description', 'Brouillon conservé');
  bff.on('post', '/bff/admin/groups', bffError(503));
  await view.act(() => groupForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="group-name"[^>]*value="Équipe conservée"/);
  assert.match(view.html, /id="group-description"[^>]*value="Brouillon conservé"/);
  assert.match(view.text(), /momentanément indisponible/);
  assert.match(view.html, /<fieldset aria-busy="false"/);
  assert.doesNotMatch(view.text(), /Groupe créé/);
  bff.on('post', '/bff/admin/groups', { status: 201, body: { group: group(2) } });
  await view.act(() => groupForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="group-name"[^>]*value=""/);
  assert.equal(bff.calls('/bff/admin/groups', 'POST').length, 2);
});

test('confirmed creation with refused reload clears the submitted form and retries only GET', async () => {
  await renderLoadedConsole();
  await openGroups();
  await changeField('group-name', 'Équipe créée');
  await changeField('group-description', 'Confirmée');
  bff.on('post', '/bff/admin/groups', { status: 201, body: { group: group(2) } });
  bff.on('get', '/bff/admin/groups', bffError(503));
  await view.act(() => groupForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="group-name"[^>]*value=""/);
  assert.match(view.text(), /Groupe créé/);
  assert.match(view.text(), /L’action est enregistrée/);
  assert.match(view.text(), /Ne répétez pas l’action/);
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => bff.calls('/bff/admin/groups', 'GET').length === 3 && view.props('GroupsPanel').busyAction === null);
  assert.match(view.text(), /Réessayer l’actualisation/, 'another refused read stays retryable');
  bff.on('get', '/bff/admin/groups', { body: { groups: [group(2)] } });
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => !view.text().includes('Ne répétez pas l’action'));
  assert.doesNotMatch(view.text(), /Ne répétez pas l’action/);
  assert.equal(bff.calls('/bff/admin/groups', 'POST').length, 1);
  assert.equal(bff.calls('/bff/admin/groups', 'GET').length, 4);
});

test('group edit keeps a refused draft and applies the confirmed DTO even if its list refresh fails', async () => {
  await renderLoadedConsole();
  await openGroups();
  bff.on('get', '/bff/admin/groups/{groupId}', { body: { group: group(1) } });
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [] } });
  await view.click((props, text) => props.type === 'button' && text.includes('Ouvrir le groupe'));
  await view.waitFor(() => view.html.includes('id="edit-group-name"'));
  await changeField('edit-group-name', ' Groupe modifié ');
  await changeField('edit-group-description', ' Description modifiée ');
  bff.on('patch', '/bff/admin/groups/{groupId}', bffError(503));
  await view.act(() => editGroupForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="edit-group-name"[^>]*value=" Groupe modifié "/);
  assert.match(view.html, /<textarea[^>]*id="edit-group-description"[^>]*> Description modifiée <\/textarea>/);
  const write = deferred();
  bff.on('patch', '/bff/admin/groups/{groupId}', () => write.promise);
  bff.on('get', '/bff/admin/groups', bffError(503));
  const pending = view.act(() => editGroupForm().props.onSubmit({ preventDefault() {} }));
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'PATCH').length === 2);
  assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
  write.resolve({ body: { group: group(1, { name: 'Groupe modifié', description: 'Description modifiée' }) } });
  await pending;
  assert.match(view.html, /id="edit-group-name"[^>]*value="Groupe modifié"/);
  assert.match(view.text(), /Groupe mis à jour/);
  assert.match(view.text(), /L’action est enregistrée/);
  assert.equal(bff.calls('/bff/admin/groups/{groupId}', 'PATCH').length, 2);
});

test('out-of-order group detail responses cannot replace the last selected group', async () => {
  await renderLoadedConsole({ groups: [group(1), group(2)] });
  await openGroups();
  const older = deferred();
  bff.on('get', '/bff/admin/groups/{groupId}', request => request.pathParams.groupId === '1'
    ? older.promise : { body: { group: group(2) } });
  bff.on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [] } });
  await view.click((props, text) => props.type === 'button' && text.includes('Groupe 1'));
  await view.waitFor(() => bff.calls('/bff/admin/groups/{groupId}', 'GET').length === 1);
  await view.click((props, text) => props.type === 'button' && text.includes('Groupe 2'));
  await view.waitFor(() => view.html.includes('value="Groupe 2"'));
  older.resolve({ body: { group: group(1) } });
  await new Promise(resolve => setImmediate(resolve));
  await view.settle();
  assert.match(view.html, /id="edit-group-name"[^>]*value="Groupe 2"/);
});

const installEditorDocument = () => {
  global.document = { getElementById: () => ({ scrollIntoView() {} }), addEventListener() {}, removeEventListener() {} };
};
const selectUserRow = (id, event = 'onClick') => {
  installEditorDocument();
  return view.fire(
  (props, text, tag) => tag === 'tr' && typeof props['aria-selected'] === 'boolean' && text.includes(`Identifiant #${id}`),
  event, event === 'onKeyDown' ? { key: 'Enter', preventDefault() {} } : undefined,
  );
};
const userEditForm = () => view.hostElements((props, _text, tag) => tag === 'form' && props.className === 'space-y-4')[0];

test('profile save freezes fields and mouse/keyboard selection until confirmation', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice confirmée');
  const write = deferred();
  bff.on('patch', '/bff/admin/users/{userId}', () => write.promise);
  const pending = view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  await view.waitFor(() => bff.calls('/bff/admin/users/{userId}', 'PATCH').length === 1);
  const locked = view.html.includes('<fieldset disabled="" aria-busy="true"');
  await selectUserRow(8);
  await selectUserRow(8, 'onKeyDown');
  const selectedBefore = view.hostElements(props => props['aria-selected'] === true && typeof props.tabIndex === 'number')[0];
  write.resolve({ status: 204 });
  await pending;
  assert.equal(locked, true, 'profile form must be disabled while its write is pending');
  assert.match(selectedBefore.text, /Identifiant #7/);
  assert.equal(selectedBefore.props.tabIndex, -1);
  assert.equal(selectedBefore.props['aria-disabled'], true);
  assert.match(view.html, /id="edit-first-name"[^>]*value="Alice confirmée"/);
  assert.match(view.text(), /Utilisateur mis à jour/);
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'PATCH').length, 1);
});

test('refused profile saves preserve all draft fields for an explicit retry', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice brouillon');
  await changeField('edit-last-name', 'Nom conservé');
  await changeField('edit-email', 'draft@mairie.test');
  await changeField('edit-phone', '+33100000000');
  bff.on('patch', '/bff/admin/users/{userId}', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="edit-first-name"[^>]*value="Alice brouillon"/);
  assert.match(view.html, /id="edit-last-name"[^>]*value="Nom conservé"/);
  assert.match(view.html, /id="edit-email"[^>]*value="draft@mairie.test"/);
  assert.match(view.html, /id="edit-phone"[^>]*value="\+33100000000"/);
  assert.doesNotMatch(view.html, /<fieldset disabled=/);
  assert.match(view.text(), /momentanément indisponible/);
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'PATCH').length, 2);
  assert.match(view.text(), /Alice brouillon Nom conservé/);
});

test('editing only a profile preserves every existing role without role mutations', async () => {
  const multiRole = { ...user(7), roles: [{ id: 1, name: 'Admin' }, { id: 2, name: 'Rôle 2' }] };
  await renderLoadedConsole({ users: [multiRole] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice modifiée');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  // A handler makes the regression observable without changing any real rights.
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').length, 0);
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles', 'POST').length, 0);
  assert.match(view.text(), /Admin, Rôle 2/);
});

test('an explicit role selection still replaces existing roles through the declared contract', async () => {
  const multiRole = { ...user(7), roles: [{ id: 1, name: 'Rôle 1' }, { id: 2, name: 'Rôle 2' }] };
  await renderLoadedConsole({ users: [multiRole], roles: [role(1), role(2), role(3)] });
  await selectUserRow(7);
  await changeField('edit-role', '3');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  bff.on('post', '/bff/admin/users/{userId}/roles', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').map(call => call.path).sort(), [
    '/bff/admin/users/7/roles/1', '/bff/admin/users/7/roles/2',
  ]);
  assert.deepEqual(bff.calls('/bff/admin/users/{userId}/roles', 'POST').map(call => call.body), [{ user_id: 7, role_id: 3 }]);
  assert.match(view.text(), /Utilisateur mis à jour/);
  assert.match(view.text(), /Rôle 3/);
  assert.equal(view.hostElements(props => props.id === 'edit-role')[0].props.value, '3');
});

test('opening a role preserves explicit false, null and absent deletability', async () => {
  installEditorDocument();
  for (const deletability of [false, null, undefined]) {
    await renderLoadedConsole({ roles: [role(1, { can_be_deleted: deletability })] });
    await view.click((props, text) => props.role === 'tab' && text === 'Rôles');
    await view.click((props, text) => props.type === 'button' && text.includes('Modifier'));
    assert.equal(view.hostElements((props, _text, tag) => tag === 'input' && props.type === 'checkbox')[0].props.checked, false);
    bff.on('put', '/bff/admin/roles/{roleId}', { status: 204 });
    await view.act(() => view.hostElements(props => props.id === 'role-form')[0].props.onSubmit({ preventDefault() {} }));
    const sent = bff.calls('/bff/admin/roles/{roleId}', 'PUT').at(-1).body;
    assert.equal(sent.can_be_deleted, deletability);
    view.unmount();
    view = undefined;
    bff.reset();
    front.reset();
  }
});

test('role edit remains locked through write/reload and retains a refused draft', async () => {
  installEditorDocument();
  await renderLoadedConsole();
  await view.click((props, text) => props.role === 'tab' && text === 'Rôles');
  await view.click((props, text) => props.type === 'button' && text.includes('Modifier'));
  await changeField('role-name', 'Rôle conservé');
  await changeField('role-description', 'Description conservée');
  const write = deferred();
  const reload = deferred();
  bff.on('put', '/bff/admin/roles/{roleId}', () => write.promise);
  bff.on('get', '/bff/admin/roles', () => reload.promise);
  const pending = view.act(() => view.hostElements(props => props.id === 'role-form')[0].props.onSubmit({ preventDefault() {} }));
  await view.waitFor(() => bff.calls('/bff/admin/roles/{roleId}', 'PUT').length === 1);
  const lockedAtWrite = view.html.includes('<fieldset disabled="" aria-busy="true"');
  write.resolve({ status: 204 });
  await view.waitFor(() => bff.calls('/bff/admin/roles', 'GET').length === 2);
  const lockedAtReload = view.html.includes('<fieldset disabled="" aria-busy="true"');
  reload.resolve({ body: { roles: [role(1)] } });
  await pending;
  assert.equal(lockedAtWrite, true);
  assert.equal(lockedAtReload, true);
  await view.click((props, text) => props.type === 'button' && text.includes('Modifier'));
  await changeField('role-name', 'Refus conservé');
  bff.on('put', '/bff/admin/roles/{roleId}', bffError(503));
  await view.act(() => view.hostElements(props => props.id === 'role-form')[0].props.onSubmit({ preventDefault() {} }));
  assert.match(view.html, /id="role-name"[^>]*value="Refus conservé"/);
  assert.doesNotMatch(view.html, /<fieldset disabled=/);
});
