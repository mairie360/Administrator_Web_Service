const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { bffUserContract, bffError } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { FRONT_ORIGIN, FrontHarness, jwt, loadTs } = require('./support/front-harness.cjs');

// Actual frontend handlers and published session-owner helpers compose with a
// real HTTP mocks. Business/logout use unchanged installed User0.5 schemas;
// owner refresh uses the documented fixture already consumed by Login main799.
const bff = new ContractMockServer('BFF_USER', bffUserContract());
const ownerDocument = OpenApiContract.load(require('node:path').join(__dirname, 'fixtures/user-session-openapi.json')).document;
const sdkDocument = bffUserContract().document;
const ownerContract = new OpenApiContract({ ...ownerDocument, paths: { ...ownerDocument.paths, '/auth/logout': sdkDocument.paths['/auth/logout'] }, components: { ...ownerDocument.components, schemas: { ...ownerDocument.components.schemas, ...sdkDocument.components.schemas } } });
const ownerBff = new ContractMockServer('LOGIN_USER', ownerContract);
let front, client, logout, access, refresh, window;
const roles = { roles: [{ id: 1, name: 'Admin', description: null, can_be_deleted: false }] };
const me = { user: { id: 1, first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', status: 'active' }, roles: [{ id: 1, name: 'Admin' }], groups: [] };
before(async () => {
  await bff.start(); await ownerBff.start();
  front = new FrontHarness({ bff, ownerBff }).install();
  [client, logout] = loadTs(['src/lib/bff-client.ts', 'src/lib/logout.ts']);
});
after(async () => { front.uninstall(); await bff.stop(); await ownerBff.stop(); });
beforeEach(() => {
  front.reset();
  access = jwt(); refresh = 'disposable-admin-refresh-' + Math.random();
  front.cookie = jwt({ exp: 1 }); front.refreshCookie = refresh;
  const store = new Map([['mairie360.auth.jwt', 'legacy'], ['mairie360.projects.jwt', 'older'], ['admin.draft', 'keep']]);
  const location = { origin: FRONT_ORIGIN, pathname: '/', search: '?panel=roles', href: FRONT_ORIGIN + '/?panel=roles', assigned: [], assign(url) { this.assigned.push(url); } };
  window = { location, store, localStorage: { getItem: key => store.get(key) ?? null, removeItem: key => store.delete(key) } };
  global.window = window;
  loadTs(['src/lib/front-urls.ts'])[0].setBrowserFrontUrls({ LOGIN_FRONT_URL: front.ownerOrigin, ADMINISTRATION_FRONT_URL: FRONT_ORIGIN });
});
afterEach(() => {
  delete global.window;
  const violations = [...bff.violations, ...ownerBff.violations, ...front.violations];
  bff.reset(); ownerBff.reset(); front.reset();
  assert.deepEqual(violations, []);
});
const read = () => client.requestBff('/bff/admin/roles');
const renewed = () => ownerBff.on('post', '/auth/refresh', { body: { message: 'JWT refreshed successfully' }, headers: { 'Set-Cookie': [
  `accessToken=${access}; Path=/auth; Max-Age=3600; HttpOnly; SameSite=Strict`,
  `refreshToken=renewed-${refresh}; Path=/auth; HttpOnly; SameSite=Strict`,
] } });
const business = () => bff.on('get', '/bff/admin/roles', req => req.headers.authorization === `Bearer ${access}` ? { body: roles } : bffError(401));

test('expired access rotates at Login and retries the actual administration read once', async () => {
  renewed(); business();
  assert.deepEqual(await read(), roles);
  assert.deepEqual(front.browserCalls, [{ method: 'GET', target: '/api/bff/bff/admin/roles' }]);
  assert.equal(front.ownerCalls.length, 1);
  assert.equal(front.ownerCalls[0].url.pathname, '/api/auth/refresh');
  assert.deepEqual(ownerBff.calls('/auth/refresh')[0].body, { refresh_token: refresh });
  assert.equal(ownerBff.calls('/auth/refresh')[0].headers.authorization, undefined);
  assert.deepEqual(bff.calls('/bff/admin/roles').map(req => req.headers.authorization), [`Bearer ${jwt({ exp: 1 })}`, `Bearer ${access}`]);
  assert.ok(bff.requests.every(req => req.headers.cookie === undefined));
  assert.equal(front.cookie, access); assert.equal(front.refreshCookie, 'renewed-' + refresh);
  assert.deepEqual(window.location.assigned, []);
});

test('concurrent profile and administration reads share one real User rotation', async () => {
  renewed(); business();
  bff.on('get', '/me', req => req.headers.authorization === `Bearer ${access}` ? { body: me } : bffError(401));
  const [a, b, profile] = await Promise.all([read(), read(), fetch('/api/user/me')]);
  assert.deepEqual(a, roles); assert.deepEqual(b, roles); assert.equal(profile.status, 200);
  assert.equal(ownerBff.calls('/auth/refresh').length, 1);
  assert.equal(bff.calls('/me').length, 2); assert.equal(bff.calls('/bff/admin/roles').length, 4);
  assert.equal(front.refreshCookie, 'renewed-' + refresh);
});

test('an absent access cookie and forged browser bearer still use only owner-issued access', async () => {
  front.cookie = undefined; renewed(); business();
  await client.requestBff('/bff/admin/roles', { headers: { Authorization: 'Bearer forged' } });
  assert.deepEqual(bff.calls('/bff/admin/roles').map(req => req.headers.authorization), [undefined, `Bearer ${access}`]);
});

for (const status of [401, 503]) test(`renewal${status} stops replay without logout, storage loss or cookie mutation`, async () => {
  business(); front.ownerOverride = () => Response.json({ message: 'Disposable refusal' }, { status });
  await assert.rejects(read(), { status });
  assert.equal(bff.calls('/bff/admin/roles').length, 1);
  assert.equal(ownerBff.calls('/auth/logout').length, 0); assert.equal(front.refreshCookie, refresh);
  assert.equal(window.store.get('mairie360.auth.jwt'), 'legacy');
  assert.equal(window.location.assigned.length, status === 401 ? 1 : 0);
  if (status === 401) {
    const target = new URL(window.location.assigned[0]);
    assert.equal(target.searchParams.get('redirect'), window.location.href);
    assert.equal(target.searchParams.has('returnUrl'), false);
  }
});

test('a malformed successful renewal never replays a business operation', async () => {
  business(); front.ownerOverride = () => Response.json({ message: 'No rotated cookies' });
  await assert.rejects(read(), { status: 502 });
  assert.equal(bff.calls('/bff/admin/roles').length, 1); assert.equal(front.refreshCookie, refresh);
  assert.deepEqual(window.location.assigned, []);
});

test('a second business401 stops after one renewal and one replay', async () => {
  renewed(); bff.on('get', '/bff/admin/roles', bffError(401));
  await assert.rejects(read(), { status: 401 });
  assert.equal(bff.calls('/bff/admin/roles').length, 2); assert.equal(ownerBff.calls('/auth/refresh').length, 1);
  assert.equal(ownerBff.calls('/auth/logout').length, 0); assert.equal(window.location.assigned.length, 1);
});

test('a declared group mutation retries its unchanged JSON body once after rotation', async () => {
  renewed(); const body = '{ "name": "Conseil municipal" }';
  bff.on('post', '/bff/admin/groups', req => req.headers.authorization === `Bearer ${access}`
    ? { status: 201, body: { group: { id: 3, name: 'Conseil municipal', description: null, owner_id: 1 } } } : bffError(401));
  await client.requestBff('/bff/admin/groups', { method: 'POST', body });
  assert.deepEqual(bff.calls('/bff/admin/groups').map(req => req.rawBody), [body, body]);
  assert.equal(ownerBff.calls('/auth/refresh').length, 1);
});

test('foreign-origin API reads and logout never reach Login or User and leave cookies intact', async () => {
  for (const [path, init] of [
    ['/api/bff/health', { headers: { Origin: 'https://foreign.test' } }],
    ['/api/auth/logout', { method: 'POST', headers: { Origin: 'https://foreign.test', 'Content-Type': 'application/json' }, body: '{}' }],
  ]) {
    const response = await fetch(path, init);
    assert.equal(response.status, 403); assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.deepEqual(bff.requests, []); assert.deepEqual(front.ownerCalls, []);
  assert.equal(front.refreshCookie, refresh);
});

test('Login authentication operations cannot be started through the administration proxy', async () => {
  for (const operation of ['/auth/login', '/auth/register', '/auth/force_change_password', '/auth/refresh']) {
    const response = await fetch('/api/bff' + operation, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 404); assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.deepEqual(bff.requests, []); assert.deepEqual(ownerBff.requests, []); assert.deepEqual(front.ownerCalls, []);
});

test('retired token refresh and revoke operations cannot leave the Administration frontend', async () => {
  front.cookie = access;
  for (const path of ['/bff/admin/sessions/refresh', '/bff/admin/sessions/revoke']) {
    const response = await fetch('/api/bff' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"refresh_token":"disposable-forbidden-token"}' });
    assert.equal(response.status, 404); assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.deepEqual(bff.requests, []); assert.deepEqual(ownerBff.requests, []); assert.deepEqual(front.ownerCalls, []);
  assert.equal(front.cookie, access); assert.equal(front.refreshCookie, refresh);
});

test('the older published User logout receipt expires local cookies without proving server revocation', async () => {
  front.cookie = access;
  ownerBff.on('post', '/auth/logout', { body: { message: 'Logged out successfully' } });
  await assert.rejects(logout.logoutAndReload(), /déconnexion n’a pas été confirmée/);
  assert.equal(front.ownerCalls.length, 1); assert.equal(front.ownerCalls[0].url.pathname, '/api/auth/logout');
  assert.deepEqual(ownerBff.calls('/auth/logout')[0].body, { refresh_token: refresh });
  assert.equal(front.cookie, undefined); assert.equal(front.refreshCookie, undefined);
  assert.equal(window.store.get('mairie360.auth.jwt'), 'legacy'); assert.equal(window.store.get('admin.draft'), 'keep');
  assert.equal(logout.isSessionRecoveryPending(), true); assert.equal(logout.navigateToLogin(), false);
  assert.deepEqual(window.location.assigned, []);
  assert.equal(logout.navigateToLogin({ explicit: true }), true);
  assert.equal(new URL(window.location.assigned[0]).searchParams.get('redirect'), window.location.href);
});

test('the browser accepts a confirmed Login receipt and clears only its known legacy keys', async () => {
  // A simulated Login receipt checks this browser boundary; it does not certify
  // Core revocation, which the unchanged published older User contract omits.
  front.ownerOverride = () => Response.json({ message: 'Session fermée.', session_revoked: true });
  await logout.logoutAndReload();
  assert.deepEqual([...window.store], [['admin.draft', 'keep']]);
  assert.equal(window.location.assigned.length, 1);
  assert.equal(new URL(window.location.assigned[0]).searchParams.get('redirect'), window.location.href);
  assert.deepEqual(bff.requests, []);
});
