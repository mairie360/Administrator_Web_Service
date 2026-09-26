const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');

// The other fronts' URLs are read at runtime (src/lib/front-urls.ts): from the server environment the
// Helm chart injects, and in the browser from what the root layout hands to FrontUrlsProvider.
// AppShell destinations resolve them on render, never at module load.

const [frontUrls, { FrontUrlsProvider }] = loadTs([
  'src/lib/front-urls.ts',
  'src/lib/front-urls-provider.tsx',
]);

const saved = { LOGIN_FRONT_URL: process.env.LOGIN_FRONT_URL, DASHBOARD_FRONT_URL: process.env.DASHBOARD_FRONT_URL };

afterEach(() => {
  delete global.window;
  frontUrls.setBrowserFrontUrls({});
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('the server reads the URLs from the runtime environment, trimmed, and skips empty ones', () => {
  process.env.DASHBOARD_FRONT_URL = '  https://dashboard.test.example/  ';
  process.env.LOGIN_FRONT_URL = ' ';

  const urls = frontUrls.readFrontUrlsFromEnv();
  assert.equal(urls.DASHBOARD_FRONT_URL, 'https://dashboard.test.example/');
  assert.equal(Object.hasOwn(urls, 'LOGIN_FRONT_URL'), false);
  assert.equal(frontUrls.frontUrl('DASHBOARD_FRONT_URL'), 'https://dashboard.test.example/');
  assert.equal(frontUrls.frontUrl('LOGIN_FRONT_URL'), undefined);
});

test('the browser only sees what the root layout handed to FrontUrlsProvider', () => {
  process.env.DASHBOARD_FRONT_URL = 'https://server-only.test.example/';
  global.window = {};
  assert.equal(frontUrls.frontUrl('DASHBOARD_FRONT_URL'), undefined);

  const children = Symbol('children');
  assert.equal(FrontUrlsProvider({ urls: { DASHBOARD_FRONT_URL: 'https://dashboard.test.example/' }, children }), children);
  assert.equal(frontUrls.frontUrl('DASHBOARD_FRONT_URL'), 'https://dashboard.test.example/');
});

test('the provider leaves the browser store alone when rendered on the server', () => {
  FrontUrlsProvider({ urls: { DASHBOARD_FRONT_URL: 'https://ignored.test.example/' }, children: null });
  global.window = {};
  assert.equal(frontUrls.frontUrl('DASHBOARD_FRONT_URL'), undefined);
});

test('every active front URL remains available at render time for the shared shell', () => {
  global.window = {};
  const urls = {
    DASHBOARD_FRONT_URL: 'https://dashboard.test.example/',
    PROJECT_FRONT_URL: 'https://project.test.example/',
    MESSAGE_FRONT_URL: 'https://message.test.example/',
    ELEARNING_FRONT_URL: 'https://elearning.test.example/',
    CALENDAR_FRONT_URL: 'https://calendar.test.example/',
    ADMINISTRATION_FRONT_URL: 'https://admin.test.example/',
    SETTINGS_FRONT_URL: 'https://settings.test.example/',
  };
  frontUrls.setBrowserFrontUrls(urls);
  for (const [key, href] of Object.entries(urls)) assert.equal(frontUrls.frontUrl(key), href, key);
});
