const assert = require('node:assert/strict');
const path = require('node:path');
const { after, afterEach, before, beforeEach, describe, test } = require('node:test');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer, unreachableUrl } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs, waitFor } = require('./support/front-harness.cjs');

// Adaptateurs de session src/app/api/** et hook useAuthSession (src/lib/auth-session.ts) contre un
// faux BFF User piloté par contracts/openapi.json. Sans DOM : `react` est remplacé par un rendu minimal
// qui exécute les effets une fois et applique les mises à jour d'état.

const contract = OpenApiContract.load(path.join(__dirname, '..', 'contracts', 'openapi.json'));
const bff = new ContractMockServer('BFF_USER', contract);
let front;
let authSession;

let hooks;
const reactStub = {
  useState: (initial) => hooks.useState(initial),
  useEffect: (effect) => hooks.useEffect(effect),
};

/** Monte un hook : un seul rendu, effets exécutés, état suivi au fil des setState. */
function renderHook(hook) {
  const effects = [];
  const result = { state: undefined, updates: 0 };
  hooks = {
    useState: (initial) => {
      result.state = initial;
      return [initial, (next) => { result.state = typeof next === 'function' ? next(result.state) : next; result.updates += 1; }];
    },
    useEffect: (effect) => effects.push(effect),
  };
  hook();
  const cleanups = effects.map((effect) => effect());
  result.unmount = () => cleanups.forEach((cleanup) => cleanup?.());
  return result;
}

function installWindow() {
  const store = new Map([['mairie360.auth.jwt', 'stored.jwt']]);
  const window = {
    reloads: 0,
    localStorage: { getItem: (key) => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: (key) => store.delete(key), clear: () => store.clear() },
    location: { reload: () => { window.reloads += 1; } },
    store,
  };
  global.window = window;
  return window;
}

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [authSession] = loadTs(['src/lib/auth-session.ts'], { stubs: { react: reactStub } });
});
after(async () => {
  front.uninstall();
  await bff.stop();
});
beforeEach(() => { installWindow(); });
afterEach(() => {
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

describe('session adapters forward to BFF User contract operations', () => {
  for (const [route, method, template] of [
    ['/api/user/me', 'GET', '/me'],
    ['/api/auth/me', 'GET', '/me'],
    ['/api/auth/session', 'GET', '/session/me'],
  ]) {
    test(`${method} ${route} → ${method} ${template} with the session cookie as Bearer`, async () => {
      bff.on(method, template, { body: me() });

      const response = await fetch(route);

      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), me());
      assert.deepEqual(bff.requests.map((request) => `${request.method} ${request.template}`), [`${method} ${template}`]);
      assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
      assert.equal(bff.requests[0].headers.cookie, undefined);
    });
  }

  test('POST /api/auth/logout → POST /auth/logout and keeps the cookie removal', async () => {
    bff.on('post', '/auth/logout', { body: { message: 'Logged out successfully' }, headers: { 'Set-Cookie': 'accessToken=; Max-Age=0; Path=/; HttpOnly' } });

    const response = await fetch('/api/auth/logout', { method: 'POST' });

    assert.equal(response.status, 200);
    assert.match(response.headers.get('set-cookie'), /accessToken=;.*Max-Age=0/);
    assert.deepEqual(bff.calls('/auth/logout', 'post').length, 1);
  });

  test('session adapters are not behind the page middleware: a missing cookie reaches the BFF 401', async () => {
    front.cookie = undefined;
    bff.on('get', '/me', { status: 401 });

    const response = await fetch('/api/user/me');

    assert.equal(response.status, 401);
    assert.equal(bff.requests[0].headers.authorization, undefined);
  });

  test('undeclared methods on an adapter never reach the BFF', async () => {
    const response = await fetch('/api/user/me', { method: 'DELETE' });

    assert.equal(response.status, 405);
    assert.deepEqual(bff.requests, []);
  });
});

describe('useAuthSession', () => {
  test('loads /api/user/me once and normalizes the contract SessionResponse', async () => {
    bff.on('get', '/me', { body: me({ role: ' administrateur ' }, { groups: [{ id: 1, name: ' Élus ', owner_id: 1 }, { id: 2, name: '', owner_id: 1 }], roles: ['user'] }) });

    const hook = renderHook(() => authSession.useAuthSession());
    assert.equal(hook.state.loading, true);
    assert.equal(hook.state.user.name, 'Chargement…');
    await waitFor(() => !hook.state.loading);

    assert.deepEqual(hook.state, {
      user: { name: 'Alice Dupont', email: 'alice@mairie.test', phone: '+33123456789', status: 'active', service: 'Élus', position: undefined, address: undefined, city: undefined, lastConnection: undefined, role: 'Admin' },
      groups: ['Élus'],
      roles: ['Admin'],
      role: 'Admin',
      isAdmin: true,
      loading: false,
      error: null,
    });
    assert.deepEqual(front.browserCalls, [{ method: 'GET', target: '/api/user/me' }]);
    assert.deepEqual(bff.requests.map(({ template }) => template), ['/me']);
  });

  test('falls back to response roles, the e-mail as name and Guest for unknown roles', async () => {
    bff.on('get', '/me', { body: me({ first_name: ' ', last_name: '', phone: null }, { groups: [], roles: ['Maire', { name: 'Stagiaire' }, { name: 'responsable' }] }) });

    const hook = renderHook(() => authSession.useAuthSession());
    await waitFor(() => !hook.state.loading);

    assert.equal(hook.state.user.name, 'alice@mairie.test');
    assert.equal(hook.state.user.phone, undefined);
    assert.equal(hook.state.user.service, undefined);
    assert.deepEqual(hook.state.roles, ['Responsable', 'Maire']);
    assert.equal(hook.state.isAdmin, false);
  });

  test('a 401 logs out through /api/auth/logout, clears storage and reloads the page', async () => {
    bff.on('get', '/me', { status: 401 })
      .on('post', '/auth/logout', { body: { message: 'Logged out successfully' } });

    const hook = renderHook(() => authSession.useAuthSession());
    await waitFor(() => global.window.reloads === 1);

    assert.deepEqual(bff.requests.map(({ method, template }) => `${method} ${template}`), ['GET /me', 'POST /auth/logout']);
    assert.equal(global.window.store.size, 0);
    assert.equal(hook.state.loading, true);
  });

  for (const [label, prepare] of [
    ['a BFF error', () => bff.on('get', '/me', { status: 502, body: { message: 'Core API indisponible' } })],
    ['an unreachable BFF', async () => {
      const url = await unreachableUrl();
      process.env.USER_BFF_URL = url;
      front.allowedOrigins.add(url);
    }],
  ]) {
    test(`reports ${label} without leaving the loading state`, async () => {
      await prepare();

      const hook = renderHook(() => authSession.useAuthSession());
      await waitFor(() => !hook.state.loading);

      assert.equal(hook.state.error, 'Les informations du profil sont indisponibles.');
      assert.equal(hook.state.role, 'Guest');
    });
  }

  test('reports a browser network failure and ignores an aborted request', async () => {
    const harnessFetch = global.fetch;
    try {
      global.fetch = async () => { throw new TypeError('Failed to fetch'); };
      const failed = renderHook(() => authSession.useAuthSession());
      await waitFor(() => !failed.state.loading);
      assert.equal(failed.state.error, 'Le service utilisateur est indisponible.');

      global.fetch = (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))));
      const aborted = renderHook(() => authSession.useAuthSession());
      aborted.unmount();
      await new Promise((resolve) => setTimeout(resolve, 20));
      assert.equal(aborted.updates, 0);
    } finally {
      global.fetch = harnessFetch;
    }
  });

  test('logoutAndReload still clears storage and reloads when the logout call fails', async () => {
    const harnessFetch = global.fetch;
    global.fetch = async () => { throw new TypeError('Failed to fetch'); };
    try {
      await assert.rejects(authSession.logoutAndReload(), /Failed to fetch/);
    } finally {
      global.fetch = harnessFetch;
    }
    assert.equal(global.window.store.size, 0);
    assert.equal(global.window.reloads, 1);
  });
});

describe('role normalization', () => {
  test('maps French and English aliases, accents, prefixes and separators', () => {
    assert.equal(authSession.normalizeAppRole('ROLE_Administrator'), 'Admin');
    assert.equal(authSession.normalizeAppRole('Invité'), 'Guest');
    assert.equal(authSession.normalizeAppRole('mayor'), 'Maire');
    assert.equal(authSession.normalizeAppRole('Utilisateur'), 'User');
    assert.equal(authSession.normalizeAppRole('inconnu'), null);
    assert.equal(authSession.normalizeAppRole(42), null);
    assert.deepEqual(authSession.resolveAppRoles(['user', { name: 'admin' }, 'admin']), ['Admin', 'User']);
    assert.deepEqual(authSession.resolveAppRoles([]), ['Guest']);
  });
});
