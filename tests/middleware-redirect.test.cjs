const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { NextRequest } = require('next/server');
const { loadTs } = require('./support/front-harness.cjs');

const [{ middleware }] = loadTs(['src/middleware.ts']);
const previous = {
  LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL,
  ADMINISTRATION_FRONT_URL: process.env.ADMINISTRATION_FRONT_URL,
};

test('missing or invalid Login configuration returns an uncached unavailable state', async () => {
  for (const value of [undefined, '', '  ', 'not a URL', 'ftp://login.mairie.test/', 'https://user:password@login.mairie.test/']) {
    if (value === undefined) delete process.env.LOGIN_FRONT_URL;
    else process.env.LOGIN_FRONT_URL = value;
    const response = middleware(new NextRequest('http://internal:3000/'));
    assert.equal(response.status, 503, String(value));
    assert.equal(response.headers.get('location'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.match(response.headers.get('content-type'), /text\/plain/);
    assert.match(response.headers.get('set-cookie'), /accessToken=;/);
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
  assert.doesNotMatch(login.href, /internal:3000/);
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
