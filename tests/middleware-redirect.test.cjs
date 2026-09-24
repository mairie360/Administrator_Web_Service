const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { NextRequest } = require('next/server');
const { loadTs } = require('./support/front-harness.cjs');

const [{ middleware }] = loadTs(['src/middleware.ts']);
const previous = {
  LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL,
  ADMINISTRATION_FRONT_URL: process.env.ADMINISTRATION_FRONT_URL,
};

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
