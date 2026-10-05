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
  assert.equal(view.find('AdministrationConsole').length, 0);
  assert.match(view.text(), /Vérification du profil/);
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

test('a pending profile does not mount the console or request administration data', async () => {
  const profile = deferred();
  bff.on('get', '/me', () => profile.promise);
  mockConsoleData();
  view = mount(React.createElement(Home));
  await view.waitFor(() => bff.calls('/me', 'GET').length === 1);

  try {
    assert.equal(view.find('AdministrationConsole').length, 0);
    assert.match(view.text(), /Vérification du profil/);
    assert.deepEqual(sequence(), ['GET /me']);
  } finally {
    profile.resolve({ body: me() });
  }

  await view.waitFor(() => consoleLoaded() && view.text().includes('Bob Martin'));
  assert.equal(view.find('AdministrationConsole').length, 1);
  assert.equal(bff.requests.filter(request => request.template.startsWith('/bff/admin/')).length, 5);
});

for (const roleName of ['Responsable', 'Maire', 'User', 'Guest']) {
  test(`a resolved ${roleName} profile keeps navigation but never mounts the administration console`, async () => {
    bff.on('get', '/me', { body: me({}, { roles: [{ id: 2, name: roleName }] }) });
    mockConsoleData();
    view = mount(React.createElement(Home));
    await view.waitFor(() => view.props('Header').user.name === 'Alice Dupont');

    assert.equal(view.find('AdministrationConsole').length, 0);
    assert.equal(view.find('AppShell').length, 1);
    assert.equal(view.props('Sidebar').isAdmin, false);
    assert.match(view.text(), /Accès réservé aux administrateurs/);
    assert.doesNotMatch(view.text(), /Bob Martin|Sessions actives|Créer un utilisateur/);
    assert.deepEqual(sequence(), ['GET /me']);
  });
}

for (const status of [403, 503]) {
  test(`a refused profile (${status}) shows a recoverable error, not a role denial or the console`, async () => {
    bff.on('get', '/me', bffError(status));
    mockConsoleData();
    view = mount(React.createElement(Home));
    await view.waitFor(() => view.text().includes('Profil indisponible'));

    assert.equal(view.find('AdministrationConsole').length, 0);
    assert.match(view.html, /role="alert"/);
    assert.doesNotMatch(view.text(), /Accès réservé aux administrateurs/);
    assert.deepEqual(sequence(), ['GET /me']);
    await view.click((props, text, tag) => tag === 'button' && text === 'Réessayer');
    assert.equal(window.reloads, 1);
    assert.deepEqual(sequence(), ['GET /me'], 'retry requests a document reload, never an administration write');
  });
}

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
  assert.equal(view.find('AdministrationConsole').length, 0);
  assert.deepEqual(sequence(), ['GET /me', 'POST /auth/logout']);
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

for (const read of [
  { tab: 'Rôles', panel: 'RolesPanel', refresh: 'refreshRoles', route: '/bff/admin/roles', envelope: 'roles', property: 'roles', latest: [role(3)] },
  { tab: 'Groupes', panel: 'GroupsPanel', refresh: 'refreshGroups', route: '/bff/admin/groups', envelope: 'groups', property: 'groups', latest: [group(3)] },
  { tab: 'Sessions', panel: 'SessionsPanel', refresh: 'refreshSessions', route: '/bff/admin/sessions', envelope: 'sessions', property: 'activeSessions', latest: [session('current-session')] },
]) {
  test(`${read.tab}: targeted failures finishing after unmount do not propagate`, async () => {
    await renderLoadedConsole();
    await view.click((props, text) => props.role === 'tab' && text === read.tab);
    const older = deferred();
    bff.on('get', read.route, () => older.promise);
    const pending = view.props(read.panel)[read.refresh]();
    await view.waitFor(() => bff.calls(read.route, 'GET').length === 2);
    view.unmount();
    older.resolve(bffError(503));
    await assert.doesNotReject(pending);
    view = undefined;
  });

  test(`${read.tab}: an older targeted success cannot replace a newer confirmed list`, async () => {
    await renderLoadedConsole();
    await view.click((props, text) => props.role === 'tab' && text === read.tab);
    const refresh = view.props(read.panel)[read.refresh];
    const original = view.props(read.panel)[read.property];
    const older = deferred();
    bff.on('get', read.route, () => older.promise);
    const pending = refresh();
    await view.waitFor(() => bff.calls(read.route, 'GET').length === 2);
    bff.on('get', read.route, { body: { [read.envelope]: read.latest } });
    if (read.tab === 'Sessions') bff.on('get', '/bff/admin/sessions/history', { body: { sessions: [] } });
    await refresh();
    await view.waitFor(() => view.props(read.panel)[read.property][0]?.id === read.latest[0].id);
    older.resolve({ body: { [read.envelope]: original } });
    await pending;
    await view.act(() => undefined);
    assert.deepEqual(view.props(read.panel)[read.property], read.latest);
    if (read.tab === 'Sessions') assert.deepEqual(view.props(read.panel).sessionHistory, []);
    assert.equal(bff.requests.some(request => request.method !== 'GET'), false);
  });

  test(`${read.tab}: a current targeted failure remains actionable without erasing the list`, async () => {
    await renderLoadedConsole();
    await view.click((props, text) => props.role === 'tab' && text === read.tab);
    const original = view.props(read.panel)[read.property];
    bff.on('get', read.route, bffError(503));
    await assert.rejects(view.props(read.panel)[read.refresh](), error => error.status === 503);
    assert.deepEqual(view.props(read.panel)[read.property], original);
    assert.equal(bff.requests.some(request => request.method !== 'GET'), false);
  });
}

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

const disposableCreationPassword = require('node:crypto').randomBytes(12).toString('base64url');
const retryUsersRead = () => view.click((_props, text, tag) => tag === 'button' && text === 'Réessayer le chargement des utilisateurs');
const usersPage = (users) => ({ users, page: 1, page_size: 20, total: users.length, total_pages: users.length ? 1 : 0 });
const openUserCreation = async () => {
  await view.click('Nouvel utilisateur');
  for (const [id, value] of [
    ['create-first-name', 'Camille'], ['create-last-name', 'Test'],
    ['create-email', 'camille@mairie.test'], ['create-password', disposableCreationPassword],
  ]) await changeField(id, value);
};

test('failed user reload retains the last received rows and retries only the current search', async () => {
  await renderLoadedConsole();
  bff.on('get', '/bff/admin/users', bffError(503));
  await view.fire(props => props.role === 'search', 'onSubmit', { preventDefault() {} });
  await view.waitFor(() => view.text().includes('momentanément indisponible'));
  assert.match(view.text(), /Identifiant #7/);
  assert.match(view.text(), /Identifiant #8/);
  assert.match(view.text(), /Dernières données reçues/);
  assert.doesNotMatch(view.text(), /L’action est enregistrée/);
  bff.on('get', '/bff/admin/users', { body: usersPage([user(8, ['Bob', 'Martin'])]) });
  await retryUsersRead();
  await view.waitFor(() => !view.text().includes('momentanément indisponible') && !view.html.includes('aria-label="Chargement"'));
  assert.doesNotMatch(view.text(), /Identifiant #7/);
  assert.match(view.text(), /Identifiant #8/);
  assert.deepEqual(bff.requests.filter(call => call.method !== 'GET'), []);
});

test('confirmed user creation with refused reload clears its form without inventing a user and retries only GET', async () => {
  await renderLoadedConsole();
  await openUserCreation();
  bff.on('post', '/bff/admin/users', { status: 204 });
  bff.on('get', '/bff/admin/users', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.text(), /Utilisateur créé/);
  assert.match(view.text(), /L’action est enregistrée, mais les utilisateurs n’ont pas pu être actualisés/);
  assert.match(view.text(), /Ne répétez pas l’action/);
  assert.match(view.text(), /Identifiant #7/);
  assert.doesNotMatch(view.text(), /Camille Test/);
  assert.doesNotMatch(view.html, /id="create-password"/);
  assert.match(view.text(), /— Utilisateurs/);
  const confirmed = user(9, ['Camille', 'Test']);
  bff.on('get', '/bff/admin/users', { body: usersPage([user(7), confirmed]) });
  await retryUsersRead();
  await view.waitFor(() => view.text().includes('Camille Test'));
  assert.doesNotMatch(view.text(), /Ne répétez pas l’action/);
  assert.equal(bff.calls('/bff/admin/users', 'POST').length, 1);
  assert.equal(bff.calls('/bff/admin/users', 'GET').length, 3);
  await view.click('Nouvel utilisateur');
  assert.equal(view.hostElements(props => props.id === 'create-first-name')[0].props.value, '');
  assert.equal(view.hostElements(props => props.id === 'create-password')[0].props.value, '');
});

test('refused user creation preserves its draft and never becomes a confirmed-reload warning', async () => {
  await renderLoadedConsole();
  await openUserCreation();
  bff.on('post', '/bff/admin/users', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(view.hostElements(props => props.id === 'create-first-name')[0].props.value, 'Camille');
  assert.equal(view.hostElements(props => props.id === 'create-password')[0].props.value, disposableCreationPassword);
  assert.doesNotMatch(view.text(), /Utilisateur créé|L’action est enregistrée/);
  assert.equal(bff.calls('/bff/admin/users', 'GET').length, 1);
  bff.on('post', '/bff/admin/users', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.text(), /Utilisateur créé/);
  assert.equal(bff.calls('/bff/admin/users', 'POST').length, 2);
});

test('confirmed user deletion with refused reload removes only its row and retries GET without another DELETE', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  bff.on('delete', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('get', '/bff/admin/users', bffError(503));
  await view.click('Supprimer l’utilisateur');
  await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
  await view.waitFor(() => view.text().includes('Utilisateur supprimé') && view.text().includes('momentanément indisponible') && view.find('ConfirmModal').every(modal => !modal.props.open));
  assert.match(view.text(), /L’action est enregistrée, mais les utilisateurs n’ont pas pu être actualisés/);
  assert.doesNotMatch(view.text(), /Identifiant #7/);
  assert.match(view.text(), /Identifiant #8/);
  assert.doesNotMatch(view.html, /id="edit-first-name"/);
  assert.match(view.text(), /— Utilisateurs/);
  assert.match(view.text(), /Total à actualiser/);
  bff.on('get', '/bff/admin/users', { body: usersPage([user(8, ['Bob', 'Martin'])]) });
  await retryUsersRead();
  await view.waitFor(() => view.text().includes('1 Utilisateurs'));
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'DELETE').length, 1);
  assert.equal(bff.calls('/bff/admin/users', 'GET').length, 3);
  assert.doesNotMatch(view.text(), /Ne répétez pas l’action|Identifiant #7/);
});

test('refused user deletion keeps the record and confirmation available for an explicit retry', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  bff.on('delete', '/bff/admin/users/{userId}', bffError(503));
  await view.click('Supprimer l’utilisateur');
  await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
  await view.waitFor(() => view.text().includes('momentanément indisponible'));
  assert.match(view.text(), /Identifiant #7/);
  assert.equal(view.find('ConfirmModal').some(modal => modal.props.open), true);
  assert.doesNotMatch(view.text(), /Utilisateur supprimé|L’action est enregistrée/);
  assert.equal(bff.calls('/bff/admin/users', 'GET').length, 1);
  bff.on('delete', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('get', '/bff/admin/users', { body: usersPage([user(8, ['Bob', 'Martin'])]) });
  await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
  await view.waitFor(() => view.text().includes('Utilisateur supprimé') && view.find('ConfirmModal').every(modal => !modal.props.open) && !view.html.includes('aria-label="Chargement"'));
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'DELETE').length, 2);
  assert.doesNotMatch(view.text(), /Identifiant #7/);
});

test('user read retry uses newly submitted criteria after a confirmed deletion and two refused reloads', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  bff.on('delete', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('get', '/bff/admin/users', bffError(503));
  await view.click('Supprimer l’utilisateur');
  await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
  await view.waitFor(() => view.text().includes('Ne répétez pas l’action') && view.find('ConfirmModal').every(modal => !modal.props.open));
  await view.fire(props => props.type === 'search', 'onChange', { target: { value: 'Bob' } });
  await view.fire(props => props.role === 'search', 'onSubmit', { preventDefault() {} });
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length === 3 && view.text().includes('Ne répétez pas l’action'));
  bff.on('get', '/bff/admin/users', { body: usersPage([user(8, ['Bob', 'Martin'])]) });
  await retryUsersRead();
  await view.waitFor(() => view.text().includes('1 Utilisateurs') && !view.text().includes('Ne répétez pas l’action'));
  assert.equal(bff.calls('/bff/admin/users', 'GET').at(-1).url.searchParams.get('search'), 'Bob');
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'DELETE').length, 1);
  assert.doesNotMatch(view.text(), /Identifiant #7/);
});

test('a users read started before a confirmed deletion cannot resurrect its row after reload failure', async () => {
  await renderLoadedConsole();
  await selectUserRow(7);
  const older = deferred();
  const consumed = deferred();
  const [{ administrationApi }] = loadTs(['src/lib/administration-api.ts']);
  const originalListUsers = administrationApi.listUsers;
  administrationApi.listUsers = async (...args) => {
    try { return await originalListUsers(...args); }
    finally { consumed.resolve(); }
  };
  bff.on('get', '/bff/admin/users', () => older.promise);
  await view.fire(props => props.role === 'search', 'onSubmit', { preventDefault() {} });
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length === 2);
  administrationApi.listUsers = originalListUsers;
  try {
    bff.on('delete', '/bff/admin/users/{userId}', { status: 204 });
    bff.on('get', '/bff/admin/users', bffError(503));
    await view.click('Supprimer l’utilisateur');
    await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
    await view.waitFor(() => view.text().includes('Ne répétez pas l’action') && view.find('ConfirmModal').every(modal => !modal.props.open));
    older.resolve({ body: usersPage([user(7), user(8, ['Bob', 'Martin'])]) });
    await consumed.promise;
    await new Promise(resolve => setImmediate(resolve));
    await view.act(() => undefined);
    assert.doesNotMatch(view.text(), /Identifiant #7/);
    assert.match(view.text(), /Identifiant #8/);
    assert.match(view.text(), /Ne répétez pas l’action|Total à actualiser/);
    assert.match(view.text(), /— Utilisateurs/);
    assert.equal(bff.calls('/bff/admin/users/{userId}', 'DELETE').length, 1);
  } finally {
    administrationApi.listUsers = originalListUsers;
    older.resolve({ body: usersPage([]) });
    await consumed.promise;
  }
});

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

test('a confirmed profile and role removal survive a separate failed addition and are not replayed', async () => {
  const account = { ...user(7), roles: [{ id: 1, name: 'Rôle 1' }] };
  await renderLoadedConsole({ users: [account], roles: [role(1), role(3)] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice confirmée');
  await changeField('edit-role', '3');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  bff.on('post', '/bff/admin/users/{userId}/roles', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  const row = () => view.hostElements((_props, text, tag) => tag === 'tr' && text.includes('Identifiant #7'))[0].text;
  assert.match(row(), /Alice confirmée/);
  assert.match(row(), /Aucun rôle/);
  assert.match(view.text(), /Le profil est enregistré/);
  assert.match(view.text(), /Retrait du rôle « Rôle 1 » confirmé/);
  assert.match(view.text(), /Ajout du rôle « Rôle 3 » non confirmé/);
  assert.doesNotMatch(view.text(), /Utilisateur mis à jour/);
  assert.equal(view.hostElements(props => props.id === 'edit-role')[0].props.value, '3');
  bff.on('post', '/bff/admin/users/{userId}/roles', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'PATCH').length, 1);
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').length, 1);
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles', 'POST').length, 2);
  assert.match(row(), /Alice confirmée.*Rôle 3/);
  assert.match(view.text(), /Utilisateur mis à jour/);
  assert.doesNotMatch(view.text(), /Les changements de rôle ne sont pas tous confirmés/);
});

test('composed partial profile confirmation survives deletion readback failure without leaking into the next editor', async () => {
  await renderLoadedConsole({ roles: [role(1), role(3)] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice confirmée');
  await changeField('edit-role', '3');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  bff.on('post', '/bff/admin/users/{userId}/roles', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.text(), /Les changements de rôle ne sont pas tous confirmés/);
  const row = view.hostElements((_props, text, tag) => tag === 'tr' && text.includes('Identifiant #7'))[0];
  assert.match(row.text, /Alice confirmée.*Aucun rôle/);

  bff.on('delete', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('get', '/bff/admin/users', bffError(503));
  await view.click('Supprimer l’utilisateur');
  await view.act(() => view.find('ConfirmModal').find(modal => modal.props.open).props.onConfirm());
  await view.waitFor(() => view.text().includes('Ne répétez pas l’action') && view.find('ConfirmModal').every(modal => !modal.props.open));
  assert.doesNotMatch(view.text(), /Identifiant #7|Les changements de rôle ne sont pas tous confirmés/);
  assert.match(view.text(), /Identifiant #8|Total à actualiser/);
  assert.doesNotMatch(view.html, /id="edit-first-name"/);

  // A new editor belongs to its own confirmed row, not to the deleted account's
  // unsatisfied role request. GET recovery must not repeat any prior write.
  await selectUserRow(8);
  await changeField('edit-first-name', 'Bob brouillon');
  bff.on('get', '/bff/admin/users', { body: usersPage([user(8, ['Bob', 'Martin'])]) });
  await retryUsersRead();
  await view.waitFor(() => view.text().includes('1 Utilisateurs') && !view.text().includes('Ne répétez pas l’action'));
  assert.equal(view.hostElements(props => props.id === 'edit-first-name')[0].props.value, 'Bob brouillon');
  assert.equal(view.hostElements(props => props.id === 'edit-role')[0].props.value, '1');
  assert.doesNotMatch(view.text(), /Les changements de rôle ne sont pas tous confirmés|Identifiant #7/);
  assert.deepEqual(bff.requests.filter(call => call.method !== 'GET').map(call => `${call.method} ${call.template}`), [
    'PATCH /bff/admin/users/{userId}',
    'DELETE /bff/admin/users/{userId}/roles/{roleId}',
    'POST /bff/admin/users/{userId}/roles',
    'DELETE /bff/admin/users/{userId}',
  ]);
  assert.equal(bff.calls('/bff/admin/users', 'GET').length, 3);
});

test('a failed removal is retried even when the confirmed target role is now first', async () => {
  const account = { ...user(7), roles: [{ id: 1, name: 'Rôle 1' }, { id: 2, name: 'Rôle 2' }, { id: 3, name: 'Rôle 3' }] };
  await renderLoadedConsole({ users: [account], roles: [role(1), role(2), role(3)] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice confirmée');
  await changeField('edit-role', '2');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', request => request.pathParams.roleId === '3'
    ? bffError(503) : { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.match(view.text(), /Retrait du rôle « Rôle 3 » non confirmé/);
  assert.match(view.text(), /Retrait du rôle « Rôle 1 » confirmé/);
  // The target is now first: equality must not discard the remaining removal.
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'PATCH').length, 1);
  assert.deepEqual(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').map(call => call.path).sort(), [
    '/bff/admin/users/7/roles/1', '/bff/admin/users/7/roles/3', '/bff/admin/users/7/roles/3',
  ]);
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles', 'POST').length, 0);
  assert.doesNotMatch(view.text(), /Les changements de rôle ne sont pas tous confirmés/);
});

test('partial multi-role removal retries only the failed removal', async () => {
  const account = { ...user(7), roles: [{ id: 3, name: 'Rôle 3' }, { id: 1, name: 'Rôle 1' }, { id: 2, name: 'Rôle 2' }] };
  await renderLoadedConsole({ users: [account], roles: [role(1), role(2), role(3)] });
  await selectUserRow(7);
  await changeField('edit-role', '');
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', request => request.pathParams.roleId === '1'
    ? bffError(503) : { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.deepEqual(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').map(call => call.path).sort(), [
    '/bff/admin/users/7/roles/1', '/bff/admin/users/7/roles/1', '/bff/admin/users/7/roles/2', '/bff/admin/users/7/roles/3',
  ]);
  assert.equal(bff.calls('/bff/admin/users/{userId}', 'PATCH').length, 0);
  assert.match(view.text(), /Aucun rôle/);
});

test('a fast role failure keeps every control locked until the slower confirmed role write ends', async () => {
  await renderLoadedConsole({ roles: [role(1), role(3)] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice confirmée');
  await changeField('edit-role', '3');
  const slowRemoval = deferred();
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', () => slowRemoval.promise);
  bff.on('post', '/bff/admin/users/{userId}/roles', bffError(503));
  const pending = view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  await view.waitFor(() => bff.calls('/bff/admin/users/{userId}/roles', 'POST').length === 1);
  await new Promise(resolve => setImmediate(resolve));
  await view.settle();
  assert.match(view.html, /<fieldset disabled="" aria-busy="true"/);
  await selectUserRow(8);
  const selected = view.hostElements((props, _text, tag) => tag === 'tr' && props['aria-selected'] === true)[0];
  slowRemoval.resolve({ status: 204 });
  await pending;
  assert.match(selected.text, /Identifiant #7/);
  assert.match(view.text(), /Retrait du rôle « Admin » confirmé/);
  assert.doesNotMatch(view.html, /<fieldset disabled=/);
});

test('a refused profile does not start role writes and preserves the complete draft', async () => {
  await renderLoadedConsole({ roles: [role(1), role(3)] });
  await selectUserRow(7);
  await changeField('edit-first-name', 'Alice brouillon');
  await changeField('edit-role', '3');
  bff.on('patch', '/bff/admin/users/{userId}', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles/{roleId}', 'DELETE').length, 0);
  assert.equal(bff.calls('/bff/admin/users/{userId}/roles', 'POST').length, 0);
  assert.equal(view.hostElements(props => props.id === 'edit-first-name')[0].props.value, 'Alice brouillon');
  assert.equal(view.hostElements(props => props.id === 'edit-role')[0].props.value, '3');
  assert.doesNotMatch(view.text(), /Le profil est enregistré|Utilisateur mis à jour/);
});

test('a delayed pre-save user read cannot restore a partially confirmed profile or role', async () => {
  await renderLoadedConsole({ roles: [role(1), role(3)] });
  await selectUserRow(7);
  const oldRead = deferred();
  bff.on('get', '/bff/admin/users', () => oldRead.promise);
  await view.act(() => view.hostElements(props => props.role === 'search')[0].props.onSubmit({ preventDefault() {} }));
  await view.waitFor(() => bff.calls('/bff/admin/users', 'GET').length === 2);
  await changeField('edit-first-name', 'Alice confirmée');
  await changeField('edit-role', '3');
  bff.on('patch', '/bff/admin/users/{userId}', { status: 204 });
  bff.on('delete', '/bff/admin/users/{userId}/roles/{roleId}', { status: 204 });
  bff.on('post', '/bff/admin/users/{userId}/roles', bffError(503));
  await view.act(() => userEditForm().props.onSubmit({ preventDefault() {} }));
  oldRead.resolve({ body: { users: [user(7), user(8, ['Bob', 'Martin'])], page: 1, page_size: 20, total: 2, total_pages: 1 } });
  await view.waitFor(() => !view.html.includes('aria-label="Chargement"'));
  await new Promise(resolve => setImmediate(resolve));
  await view.settle();
  const row = view.hostElements((_props, text, tag) => tag === 'tr' && text.includes('Identifiant #7'))[0];
  assert.match(row.text, /Alice confirmée/);
  assert.match(row.text, /Aucun rôle/);
  assert.match(view.text(), /Les changements de rôle ne sont pas tous confirmés/);
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

const sessionTokenField = () => view.hostElements(props => props.id === 'session-refresh-token')[0].props;
const sessionCommand = label => view.hostElements((props, text, tag) => tag === 'button' && text === label)[0].props;

for (const action of ['refresh', 'revoke']) {
  const label = action === 'refresh' ? 'Rafraîchir' : 'Révoquer';
  const competingLabel = action === 'refresh' ? 'Révoquer' : 'Rafraîchir';
  const route = `/bff/admin/sessions/${action}`;
  const confirmation = action === 'refresh'
    ? { body: { message: 'JWT refreshed successfully' } } : { status: 204 };

  test(`session ${action}: protects the draft and competing commands through write/readback`, async () => {
    await renderLoadedConsole();
    await view.click((props, text) => props.role === 'tab' && text === 'Sessions');
    const token = require('node:crypto').randomUUID();
    await changeField('session-refresh-token', token);
    const write = deferred();
    const reload = deferred();
    bff.on('post', route, () => write.promise);
    bff.on('get', '/bff/admin/sessions', () => reload.promise);
    const submit = sessionCommand(label).onClick;
    const compete = sessionCommand(competingLabel).onClick;
    await view.act(() => { submit(); submit(); compete(); });
    await view.waitFor(() => bff.calls(route, 'POST').length === 1);
    const lockedAtWrite = sessionTokenField().disabled === true;
    const competingLocked = sessionCommand(competingLabel).disabled === true;
    await changeField('session-refresh-token', require('node:crypto').randomUUID());
    const draftProtected = sessionTokenField().value === token;
    write.resolve(confirmation);
    await view.waitFor(() => bff.calls('/bff/admin/sessions', 'GET').length === 2);
    const lockedAtRead = sessionTokenField().disabled === true;
    reload.resolve({ body: { sessions: [session('confirmed')] } });
    await view.waitFor(() => sessionTokenField().value === '' && view.props('SessionsPanel').busyAction === null);
    assert.equal(lockedAtWrite, true);
    assert.equal(competingLocked, true);
    assert.equal(draftProtected, true);
    assert.equal(lockedAtRead, true);
    assert.equal(sessionTokenField().disabled, false);
    const writes = bff.requests.filter(request => request.method !== 'GET');
    assert.equal(writes.length, 1);
    assert.equal(writes[0].body.refresh_token === token, true);
  });

  test(`session ${action}: retains refusal, clears confirmation and retries failed readback with GET only`, async () => {
    await renderLoadedConsole();
    await view.click((props, text) => props.role === 'tab' && text === 'Sessions');
    const token = require('node:crypto').randomUUID();
    await changeField('session-refresh-token', token);
    bff.on('post', route, bffError(503));
    await view.click((props, text, tag) => tag === 'button' && text === label);
    await view.waitFor(() => bff.calls(route, 'POST').length === 1 && view.props('SessionsPanel').busyAction === null);
    assert.equal(sessionTokenField().value === token, true);
    assert.equal(sessionTokenField().disabled, false);
    assert.equal(sessionCommand(label).disabled, false);
    bff.on('post', route, confirmation);
    bff.on('get', '/bff/admin/sessions', bffError(503));
    await view.click((props, text, tag) => tag === 'button' && text === label);
    await view.waitFor(() => sessionTokenField().value === '' && view.props('SessionsPanel').busyAction === null);
    assert.match(view.text(), /L’action est enregistrée/);
    assert.match(view.text(), /Ne répétez pas l’action/);
    assert.equal(bff.calls(route, 'POST').length, 2);
    bff.on('get', '/bff/admin/sessions', { body: { sessions: [session('fresh')] } });
    await view.click('Réessayer l’actualisation');
    await view.waitFor(() => !view.text().includes('Ne répétez pas l’action'));
    assert.equal(bff.requests.filter(request => request.method !== 'GET').length, 2);
    assert.equal(bff.calls('/bff/admin/sessions', 'GET').length, 3);
    assert.equal(view.props('SessionsPanel').activeSessions[0].id, 'fresh');
  });
}

test('session form commands refuse empty or whitespace input without any mutation', async () => {
  await renderLoadedConsole();
  await view.click((props, text) => props.role === 'tab' && text === 'Sessions');
  for (const value of ['', '   ']) {
    await changeField('session-refresh-token', value);
    assert.equal(sessionCommand('Rafraîchir').disabled, true);
    assert.equal(sessionCommand('Révoquer').disabled, true);
    await view.act(() => { sessionCommand('Rafraîchir').onClick(); sessionCommand('Révoquer').onClick(); });
  }
  assert.equal(bff.requests.some(request => request.method !== 'GET'), false);
});
