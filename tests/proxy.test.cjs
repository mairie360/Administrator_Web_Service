const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const { NextRequest } = require('next/server');
const originalLoader = require.extensions['.ts'];
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, resolveJsonModule: true } }).outputText, filename);
const { proxyBffRequest, forwardToBff } = require('../src/lib/bff-proxy.ts');
require.extensions['.ts'] = originalLoader;
const originalFetch = global.fetch;
const bffUrlVariables = ['BFF_ADMIN_BASE_URL', 'USER_BFF_URL', 'BFF_USER_API_URL', 'NEXT_PUBLIC_BFF_ADMIN_BASE_URL'];
const originalBffUrls = Object.fromEntries(bffUrlVariables.map((name) => [name, process.env[name]]));
afterEach(() => {
  global.fetch = originalFetch;
  for (const [name, value] of Object.entries(originalBffUrls)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

test('proxy preserves query and data while cookies override browser authorization', async () => {
  process.env.BFF_ADMIN_BASE_URL = 'http://bff.example';
  let called;
  global.fetch = async (url, init) => { called = { url: String(url), init }; return Response.json({ id: '42', value: null }, { status: 201 }); };
  const request = new NextRequest('http://localhost/health?q=a%26b', { headers: { cookie: 'accessToken=test-session', Authorization: 'Bearer explicit-session' } });
  const response = await proxyBffRequest(request, { params: Promise.resolve({ path: ['health'] }) });
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { id: '42', value: null });
  assert.equal(new URL(called.url).search, '?q=a%26b'); assert.equal(called.init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(called.init.headers.get('cookie'), null); assert.equal(called.init.redirect, 'manual');
});
test('proxy preserves the declared user creation body bytes and upstream response', async () => {
  const bytes = Buffer.from(JSON.stringify({ email: 'fixture@example.test', first_name: 'Fixture', last_name: 'User', password: 'FixtureOnly!123' }));
  let init;
  global.fetch = async (_url, options) => { init = options; return Response.json({ id: 'fixture-user' }, { status: 201 }); };
  const request = new NextRequest('http://localhost/users', { method: 'POST', headers: { 'Content-Type': 'application/json', cookie: 'accessToken=test-session' }, body: bytes });
  const response = await forwardToBff(request, 'http://bff.example', '/bff/admin/users');
  assert.equal(response.status, 201); assert.deepEqual(await response.json(), { id: 'fixture-user' });
  assert.deepEqual(new Uint8Array(init.body), new Uint8Array(bytes)); assert.equal(init.headers.get('Authorization'), 'Bearer test-session');
  assert.equal(init.headers.get('Content-Type'), 'application/json');
});
test('contract rejects unknown routes and methods before contacting the BFF', async () => {
  global.fetch = async () => { throw new Error('must not be called'); };
  const missing = await proxyBffRequest(new NextRequest('http://localhost/unknown'), { params: Promise.resolve({ path: ['unknown'] }) });
  assert.equal(missing.status, 404);
  const wrongMethod = await proxyBffRequest(new NextRequest('http://localhost/health', { method: 'DELETE' }), { params: Promise.resolve({ path: ['health'] }) });
  assert.equal(wrongMethod.status, 405); assert.match(wrongMethod.headers.get('Allow'), /GET/);
});
test('business errors preserve their body without adopting upstream credential cookies', async () => {
  global.fetch = async () => Response.json({ message: 'Denied' }, { status: 403, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/; HttpOnly' } });
  const result = await forwardToBff(new NextRequest('http://localhost/health'), 'http://bff.example', '/health');
  assert.equal(result.status, 403); assert.deepEqual(await result.json(), { message: 'Denied' }); assert.equal(result.headers.get('Set-Cookie'), null);
});

test('a browser bearer without any cookie cannot authenticate the relay', async () => {
  let authorization;
  global.fetch = async (_url, init) => { authorization = init.headers.get('authorization'); return Response.json({}, { status: 401 }); };
  const result = await forwardToBff(new NextRequest('http://localhost/me', { headers: { Authorization: 'Bearer forged-browser' } }), 'http://bff.example', '/me');
  assert.equal(result.status, 401);
  assert.equal(authorization, null);
  assert.equal(result.headers.get('X-Mairie360-Login-Required'), 'true');
  assert.equal(result.headers.get('Set-Cookie'), null);
});

test('undeclared uploads and metadata never contact a service', async () => {
  global.fetch = async () => { throw new Error('must not be called'); };
  for (const path of ['/files', '/openapi.json', '/swagger.json']) {
    const result = await forwardToBff(new NextRequest('http://localhost' + path), 'http://bff.example', path);
    assert.equal(result.status, 404, path);
    assert.equal(result.headers.get('Cache-Control'), 'no-store');
  }
});
test('unavailable BFF produces a controlled error', async () => {
  global.fetch = async () => { throw new Error('connection refused'); };
  const result = await forwardToBff(new NextRequest('http://localhost/health'), 'http://bff.example', '/health');
  assert.equal(result.status, 502); assert.equal(result.headers.get('Cache-Control'), 'no-store');
});

for (const [name, value] of [
  ['missing', undefined],
  ['empty', ''],
  ['malformed', 'not-a-url'],
  ['unsupported protocol', 'file:///tmp/bff'],
  ['embedded credentials', 'http://user:password@example.test'],
  ['query string', 'http://bff.example?token=example'],
  ['fragment', 'http://bff.example#fragment'],
]) {
  test(`${name} BFF URL returns an uncached 503 without an upstream call`, async () => {
    for (const variable of bffUrlVariables) delete process.env[variable];
    if (value !== undefined) process.env.BFF_ADMIN_BASE_URL = value;
    global.fetch = async () => { throw new Error('must not be called'); };

    const response = await proxyBffRequest(new NextRequest('http://localhost/health'), { params: Promise.resolve({ path: ['health'] }) });

    assert.equal(response.status, 503);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.deepEqual(await response.json(), { error: { message: 'Le service n’est pas configuré.' } });
  });
}
