const assert = require('node:assert/strict');
const { test, before, after, beforeEach, afterEach } = require('node:test');
const { bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, FRONT_ORIGIN, loadTs, jwt } = require('./support/front-harness.cjs');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
const bff = new ContractMockServer('BFF_USER', bffUserContract());
let access, Home, front, view, installed = false;
const keys = ['ADMINISTRATION_FRONT_URL', 'BFF_ADMIN_BASE_URL', 'USER_BFF_URL', 'BFF_USER_URL', 'LOGIN_FRONT_URL'];
const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
const me = role => ({ user: { id: 1, first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', status: 'active' }, groups: [], roles: [{ id: 1, name: role }] });
const user = { id: 7, first_name: 'Bob', last_name: 'Martin', email: 'bob@mairie.test', phone_number: null, status: 'active', is_archived: false, roles: [{ id: 2, name: 'User' }] };
const users = { users: [user], page: 1, page_size: 20, total: 1, total_pages: 1 };
function seed(role = 'Admin') {
  bff.on('get', '/me', { body: me(role) });
  bff.on('get', '/admin/users', { body: users });
  for (const [path, key] of [['roles', 'roles'], ['groups', 'groups'], ['sessions', 'sessions'], ['sessions/history', 'sessions']]) bff.on('get', '/admin/' + path, { body: { [key]: [] } });
}
before(async () => {
  await bff.start(); front = new FrontHarness({ bff });
  [{ default: Home }] = loadTs(['src/app/page.tsx'], { stubs: { 'next/headers': { cookies: async () => ({ get: key => { assert.equal(key, 'accessToken', 'SSR must never read a refresh cookie'); return access ? { value: access } : undefined; } }) } } });
});
after(async () => { await bff.stop(); for (const [key, value] of Object.entries(previous)) value === undefined ? delete process.env[key] : process.env[key] = value; });
beforeEach(() => { access = front.cookie; process.env.ADMINISTRATION_FRONT_URL = FRONT_ORIGIN; process.env.BFF_ADMIN_BASE_URL = bff.url; process.env.LOGIN_FRONT_URL = front.ownerOrigin; });
afterEach(() => { view?.unmount(); view = undefined; if (installed) { front.uninstall(); installed = false; } assert.deepEqual([...bff.violations, ...front.violations], []); bff.reset(); front.reset(); delete global.window; delete global.document; });

test('the real server page authorizes through the actual profile and renders administration data before JavaScript', async () => {
  seed(); const element = await Home(); const html = renderToStaticMarkup(element);
  assert.match(html, /Bob Martin/); assert.match(html, /Alice Dupont/);
  assert.equal(bff.requests.length, 6); assert.equal(bff.requests[0].template, '/me');
  for (const request of bff.requests) { assert.equal(request.method, 'GET'); assert.equal(request.headers.authorization, `Bearer ${access}`); assert.equal(request.headers.cookie, undefined); }
  assert.doesNotMatch(JSON.stringify(element.props), /accessToken|refreshToken/);
  assert.ok(!JSON.stringify(element.props).includes(access));
  front.install(); installed = true; global.window = { location: { origin: FRONT_ORIGIN, search: '', href: FRONT_ORIGIN + '/' }, localStorage: { getItem: () => null }, requestAnimationFrame: fn => fn() };
  view = mount(element); await new Promise(resolve => setImmediate(resolve));
  assert.equal(bff.requests.length, 6, 'No duplicate profile, resource or users bootstrap after a confirmed server receipt.');
  assert.equal(front.browserCalls.length, 0);
});

for (const tab of ['users', 'roles', 'groups']) test(`server-rendered ${tab} fields have no native SDK submission endpoint before hydration`, async () => {
  const { JSDOM } = require('jsdom');
  seed(); const document = new JSDOM(renderToStaticMarkup(await Home({ searchParams: Promise.resolve({ tab }) })));
  try {
    const fields = [...document.window.document.querySelectorAll('main input, main textarea, main select')];
    assert.ok(fields.length, 'Confirmed fields remain visible in the first HTML.');
    assert.equal(document.window.document.querySelectorAll('main form').length, 0, 'SDK handlers do not have an HTML form endpoint.');
    for (const field of fields) { assert.equal(field.form, null); assert.ok(field.matches(':disabled'), field.id || field.type); }
    assert.match(document.window.document.querySelector('main noscript').textContent, /JavaScript/);
  } finally { document.window.close(); }
});

const performanceFixture = require('./fixtures/performance.json');
const performancePaths = ['/me', '/admin/users', '/admin/roles', '/admin/groups', '/admin/sessions', '/admin/sessions/history'];
const performanceBody = path => performanceFixture.routes[path === '/me' ? '/api/auth/me' : path];
test('the performance laboratory responses satisfy every actual published bootstrap operation', () => {
  const contract = bffUserContract();
  for (const path of performancePaths) {
    const operation = contract.match('GET', path);
    assert.ok(operation, path);
    const response = contract.responseSchema(operation, 200);
    assert.ok(response.documented && response.schema, path);
    assert.deepEqual(contract.validate(response.schema, performanceBody(path)), [], path);
  }
});
test('the actual performance fixture renders confirmed users and all console resources without an application alert', async () => {
  for (const path of performancePaths) bff.on('get', path, { body: performanceBody(path) });
  const element = await Home();
  const state = element.props.initialState;
  assert.equal(state.session.error, null);
  assert.equal(state.console.error, null);
  assert.equal(state.console.usersError, null);
  for (const key of ['users', 'roles', 'groups', 'activeSessions', 'sessionHistory']) assert.notEqual(state.console[key], null, key);
  assert.equal(state.console.users.users[0].email, performanceFixture.readyText);
  const html = renderToStaticMarkup(element);
  assert.ok(html.includes(performanceFixture.readyText), 'Readiness is a real received user field.');
  assert.doesNotMatch(html, /role="alert"|incohérentes|Certaines données n’ont pas pu être chargées/);
  assert.equal(bff.requests.length, 6);
});

test('a User profile cannot gain administration reads from an Admin-shaped access token', async () => {
  seed('User'); const html = renderToStaticMarkup(await Home());
  assert.match(html, /Accès réservé aux administrateurs/); assert.deepEqual(bff.requests.map(request => request.template), ['/me']);
});
for (const mode of ['missing', 'expired', 'origin']) test(`${mode} prerequisite produces an explicit retry without any network read`, async () => {
  if (mode === 'missing') access = undefined;
  if (mode === 'expired') access = jwt({ exp: 1 });
  if (mode === 'origin') process.env.ADMINISTRATION_FRONT_URL = 'https://outside.test/path?unsafe=1';
  const html = renderToStaticMarkup(await Home()); assert.match(html, /Réessayer/); assert.equal(bff.requests.length, 0);
});
for (const status of [401, 403, 503, 200]) test(`profile ${status} refusal or malformed data cannot become a confirmed administration session`, async () => {
  seed(); bff.on('get', '/me', { status, outOfContract: true, body: { secret: 'sensitive upstream diagnostic' } });
  const html = renderToStaticMarkup(await Home());
  assert.match(html, /Réessayer/); assert.doesNotMatch(html, /Bob Martin|sensitive upstream diagnostic|Accès réservé/);
  assert.deepEqual(bff.requests.map(request => request.template), ['/me']);
});
test('known profile and administration fields alone cross the RSC boundary and every render gets a fresh opaque identity', async () => {
  seed(); bff.on('get', '/me', { outOfContract: true, body: { ...me('Admin'), accessToken: 'private', user: { ...me('Admin').user, password: 'private' } } });
  bff.on('get', '/admin/users', { outOfContract: true, body: { ...users, cookies: 'private', users: [{ ...user, password: 'private', roles: [{ id: 2, name: 'User', secret: 'private' }] }] } });
  const first = await Home({ searchParams: Promise.resolve({ tab: 'users', usersSearch: 'Bob', usersPage: '2', token: 'private' }) });
  assert.match(renderToStaticMarkup(first), /Bob Martin/); assert.doesNotMatch(JSON.stringify(first.props), /private|password|cookies|secret/);
  assert.equal(first.props.initialSearch, 'tab=users&usersSearch=Bob&usersPage=2');
  seed('User'); const second = await Home();
  assert.equal(second.props.initialState.session.isAdmin, false);
  assert.doesNotMatch(renderToStaticMarkup(second), /Bob Martin/);
  assert.ok(first.key && second.key && first.key !== second.key);
  assert.match(bff.requests.find(request => request.template === '/admin/users').url.search, /page=2.*search=Bob/);
});
test('malformed console DTOs remain failed reads while independent confirmed resources are retained', async () => {
  seed(); bff.on('get', '/admin/users', { outOfContract: true, body: { users: [{ id: 'bad' }] } });
  bff.on('get', '/admin/groups', { outOfContract: true, body: { groups: [{ id: 'bad' }] } });
  const element = await Home(), html = renderToStaticMarkup(element);
  assert.match(html, /incohérentes/); assert.doesNotMatch(html, /Aucun utilisateur disponible/);
  assert.equal(element.props.initialState.console.roles.length, 0); assert.equal(element.props.initialState.console.groups, null);
  assert.equal(element.props.initialState.console.users, null);
});
test('loading is an immediate persistent accessible structure with reduced-motion support', () => {
  const [{ default: Loading }] = loadTs(['src/app/loading.tsx']); const html = renderToStaticMarkup(React.createElement(Loading));
  assert.match(html, /aria-busy="true"/); assert.match(html, /role="status"/); assert.match(html, /motion-safe:animate-pulse/);
});

function client() {
  front.install(); installed = true;
  const browser = new EventTarget();
  Object.assign(browser, { location: { origin: FRONT_ORIGIN, search: '', href: FRONT_ORIGIN + '/' }, localStorage: { getItem: () => null }, requestAnimationFrame: fn => fn() });
  global.window = browser;
  global.document = Object.assign(new EventTarget(), { hidden: false, getElementById: () => null });
  loadTs(['src/lib/front-urls.ts'])[0].setBrowserFrontUrls({ LOGIN_FRONT_URL: front.ownerOrigin, ADMINISTRATION_FRONT_URL: FRONT_ORIGIN });
  return browser;
}
test('an unconfirmed SSR session can recover through the real same-origin profile route without a document reload', async () => {
  seed(); access = undefined; const element = await Home(); assert.equal(bff.requests.length, 0);
  client(); view = mount(element); assert.match(view.text(), /Réessayer/); assert.equal(front.browserCalls.length, 0);
  await view.click((_props, text, tag) => tag === 'button' && text === 'Réessayer');
  await view.waitFor(() => view.text().includes('Bob Martin'));
  assert.equal(bff.calls('/me', 'GET').length, 1); assert.equal(bff.requests.length, 6);
  assert.equal(front.browserCalls.filter(call => call.target === '/api/user/me').length, 1);
});
test('foreground updates retain a user editor draft and last confirmed rows after an invalid replacement', async () => {
  seed(); const element = await Home(); const browser = client(); view = mount(element);
  await view.click((_props, text, tag) => tag === 'button' && text === 'Nouvel utilisateur');
  await view.fire(props => props.id === 'create-first-name', 'onChange', { target: { value: 'Brouillon conservé' } });
  bff.on('get', '/admin/users', { body: { ...users, users: [{ ...user, last_name: 'Actualisé' }] } });
  browser.dispatchEvent(new Event('focus')); await view.waitFor(() => view.text().includes('Bob Actualisé'));
  assert.equal(view.hostElements(props => props.id === 'create-first-name')[0].props.value, 'Brouillon conservé');
  bff.on('get', '/admin/users', { outOfContract: true, body: { users: [], total: 'invalid' } });
  browser.dispatchEvent(new Event('focus')); await view.waitFor(() => view.text().includes('incohérentes'));
  assert.match(view.text(), /Bob Actualisé/);
  assert.equal(view.hostElements(props => props.id === 'create-first-name')[0].props.value, 'Brouillon conservé');
});
test('the shared parsers reject invalid scalar DTOs and ignore unknown profile authority fields', () => {
  const [responses, profile] = loadTs(['src/lib/administration-response.ts', 'src/lib/auth-session-model.ts']);
  for (const change of [value => { value.page = {}; }, value => { value.users[0].id = Infinity; }, value => { value.users[0].phone_number = {}; }, value => { value.users[0].roles[0].name = []; }, value => { value.users[0].is_archived = 'false'; }]) {
    const value = structuredClone(users); change(value); assert.throws(() => responses.parseUsersPage(value), /incohérentes/);
  }
  assert.throws(() => responses.parseGroups({ groups: [{ id: 1, name: 'Group', owner_id: 1 }] }), /incohérentes/);
  assert.throws(() => responses.parseRoles({ roles: [{ id: 1, name: 'Role', description: 'Role', can_be_deleted: 'true' }] }), /incohérentes/);
  assert.throws(() => responses.parseSessions({ sessions: [{ id: 's', device_info: '', ip_address: '', created_at: '', expires_at: '', revoked_at: {} }] }), /incohérentes/);
  for (const value of [null, { ...me('Admin'), groups: [null] }, { ...me('Admin'), roles: [{ name: [] }] }, { ...me('Admin'), user: { ...me('Admin').user, phone: {} } }]) assert.throws(() => profile.parseAuthSession(value), /incohérentes/);
  const value = me('User'); value.user.roles = [{ name: 'Admin' }]; value.user.name = 'private'; value.user.phone_number = 'private';
  const session = profile.parseAuthSession(value); assert.equal(session.isAdmin, false); assert.equal(session.user.name, 'Alice Dupont'); assert.ok(!JSON.stringify(session).includes('private'));
});
