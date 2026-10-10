const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { NextRequest } = require('next/server');
const { loadTs } = require('./support/front-harness.cjs');

const [{ middleware }] = loadTs(['src/middleware.ts']);
const previous = {
  LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL,
  ADMINISTRATION_FRONT_URL: process.env.ADMINISTRATION_FRONT_URL,
  SETTINGS_FRONT_URL: process.env.SETTINGS_FRONT_URL,
};

const b64url = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const validCookie = `accessToken=${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ exp: Math.floor(Date.now() / 1000) + 3600 })}.signature`;

test('missing or invalid Login configuration returns an uncached unavailable state', async () => {
  for (const value of [undefined, '', '  ', 'not a URL', 'ftp://login.mairie.test/', 'https://user:password@login.mairie.test/']) {
    if (value === undefined) delete process.env.LOGIN_FRONT_URL;
    else process.env.LOGIN_FRONT_URL = value;
    const response = middleware(new NextRequest('http://internal:3000/'));
    assert.equal(response.status, 503, String(value));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-type'), /text\/plain/);
    assert.equal(response.headers.get('set-cookie'), null);
    assert.match(await response.text(), /Connexion temporairement indisponible/);
  }
});

test('an explicitly configured local destination is accepted without a hard-coded fallback', () => {
  process.env.LOGIN_FRONT_URL = '  http://localhost:5010/login  ';
  const response = middleware(new NextRequest('http://internal:3000/'));
  assert.equal(response.status, 307);
  const target = new URL(response.headers.get('location'));
  assert.equal(target.origin, 'http://localhost:5010');
  assert.equal(target.pathname, '/login');
});


afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('an unauthenticated visit returns to the public Administration URL, not the ingress host', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  process.env.ADMINISTRATION_FRONT_URL = 'https://admin.mairie.test/';

  const response = middleware(new NextRequest('http://internal:3000/users/42?tab=roles'));
  const login = new URL(response.headers.get('location'));

  assert.equal(response.status, 307);
  assert.equal(login.origin, 'https://login.mairie.test');
  assert.equal(login.searchParams.get('redirect'), 'https://admin.mairie.test/users/42?tab=roles');
  assert.equal(login.searchParams.get('resumeSession'), '1');
  assert.equal(response.headers.get('set-cookie'), null);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.doesNotMatch(login.href, /internal:3000/);
});

test('opaque cookies and JWTs without a finite expiry resume at Login without rendering the protected document', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  process.env.ADMINISTRATION_FRONT_URL = 'https://admin.mairie.test/';
  const token = payload => `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.signature`;
  for (const value of ['opaque-session', 'two.segments', '.e30.signature', token({}), token({ exp: '9999999999' }), token({ exp: null }), token({ exp: 0 })]) {
    const response = middleware(new NextRequest('http://internal:3000/?panel=sessions', { headers: { cookie: `accessToken=${value}; refreshToken=preserved` } }));
    assert.equal(response.status, 307);
    const destination = new URL(response.headers.get('location'));
    assert.equal(destination.searchParams.get('redirect'), 'https://admin.mairie.test/?panel=sessions');
    assert.equal(destination.searchParams.get('resumeSession'), '1');
    assert.equal(response.headers.get('set-cookie'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('x-middleware-request-x-nonce'), null);
  }
});

test('a missing public Administration URL keeps Login’s default destination', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  delete process.env.ADMINISTRATION_FRONT_URL;

  const response = middleware(new NextRequest('http://internal:3000/users/42?tab=roles'));
  const login = new URL(response.headers.get('location'));

  assert.equal(response.status, 307);
  assert.equal(login.href, 'https://login.mairie.test/');
  assert.equal(login.searchParams.has('redirect'), false);
});

test('an invalid public Administration URL does not leak the ingress URL to Login', () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  process.env.ADMINISTRATION_FRONT_URL = 'not a valid URL';

  const response = middleware(new NextRequest('http://internal:3000/users/42?tab=roles'));
  const login = new URL(response.headers.get('location'));

  assert.equal(response.status, 307);
  assert.equal(login.href, 'https://login.mairie.test/');
  assert.doesNotMatch(login.href, /internal:3000/);
});

test('authenticated legacy profile bookmarks redirect to Settings without a local profile page', () => {
  process.env.SETTINGS_FRONT_URL = 'https://settings.mairie.test/account/';
  for (const pathname of ['/profile', '/profile/security']) {
    const response = middleware(new NextRequest(`http://internal:3000${pathname}`, { headers: { cookie: validCookie } }));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('location'), 'https://settings.mairie.test/account/');
  }
});

test('an invalid or looping Settings destination leaves a clear uncached unavailable state', async () => {
  for (const destination of [undefined, 'javascript:alert(1)', 'https://settings.mairie.test/profile']) {
    if (destination === undefined) delete process.env.SETTINGS_FRONT_URL;
    else process.env.SETTINGS_FRONT_URL = destination;
    const response = middleware(new NextRequest('http://internal:3000/profile', { headers: { cookie: validCookie } }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(await response.text(), /Paramètres indisponibles/);
  }
});
