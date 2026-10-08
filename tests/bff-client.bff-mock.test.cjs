const assert = require('node:assert/strict');
const { after, afterEach, before, describe, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');

// requestBff (src/lib/bff-client.ts) et le jeton stocké côté navigateur (src/lib/auth-token.ts),
// contre le faux BFF User piloté par le contrat du paquet publié @mairie360/bff-user-openapi.

const bff = new ContractMockServer('BFF_USER', bffUserContract());
let front;
let requestBff;
let authToken;

function installStorage(entries = {}, { failing = false } = {}) {
  const store = new Map(Object.entries(entries));
  const guard = (fn) => (...args) => { if (failing) throw new DOMException('Accès refusé', 'SecurityError'); return fn(...args); };
  global.window = {
    localStorage: {
      getItem: guard((key) => store.get(key) ?? null),
      setItem: guard((key, value) => store.set(key, value)),
      removeItem: guard((key) => store.delete(key)),
    },
  };
  return store;
}

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ requestBff }, authToken] = loadTs(['src/lib/bff-client.ts', 'src/lib/auth-token.ts']);
});
after(async () => {
  front.uninstall();
  await bff.stop();
});
afterEach(() => {
  delete global.window;
  const violations = [...bff.violations, ...front.violations];
  bff.reset();
  front.reset();
  assert.deepEqual(violations, []);
});

describe('requestBff', () => {
  test('returns plain text when the BFF does not answer JSON, and undefined for an empty body', async () => {
    bff.on('get', '/health', { raw: 'OK', contentType: 'text/plain' });
    assert.equal(await requestBff('/health'), 'OK');

    bff.on('get', '/health', {});
    assert.equal(await requestBff('/health'), undefined);
    assert.equal(bff.requests[0].headers.accept, 'application/json');
  });

  test('keeps caller headers and does not add Content-Type without a body', async () => {
    bff.on('get', '/check_apis', { body: { status: 'OK', core_api: 'Connected' } });

    assert.deepEqual(await requestBff('/check_apis', { headers: { Accept: 'application/json, text/plain' } }), { status: 'OK', core_api: 'Connected' });
    assert.equal(bff.requests[0].headers.accept, 'application/json, text/plain');
    assert.equal(bff.requests[0].headers['content-type'], undefined);
  });

  test('legacy browser storage cannot replace the session cookie; explicit caller headers stay intact', async () => {
    bff.on('get', '/me', bffError(401));
    installStorage({ 'mairie360.auth.jwt': ' stored.jwt ' });

    await assert.rejects(requestBff('/me'));
    await assert.rejects(requestBff('/me', { headers: { Authorization: 'Bearer explicit.jwt' } }));

    assert.deepEqual(bff.requests.map(({ headers }) => headers.authorization), [`Bearer ${front.cookie}`, 'Bearer explicit.jwt']);
  });

  test('does not read or migrate the legacy storage key during a data request', async () => {
    bff.on('get', '/health', { raw: 'OK', contentType: 'text/plain' });
    const store = installStorage({ 'mairie360.projects.jwt': 'legacy.jwt' });

    assert.equal(await requestBff('/health'), 'OK');

    assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
    assert.deepEqual([...store], [['mairie360.projects.jwt', 'legacy.jwt']]);
  });

  test('a data request never accesses browser storage, including a denied storage getter', async () => {
    bff.on('get', '/health', { raw: 'OK', contentType: 'text/plain' });
    let accesses = 0;
    global.window = {
      get localStorage() {
        accesses += 1;
        throw new DOMException('Accès refusé', 'SecurityError');
      },
    };

    assert.equal(await requestBff('/health'), 'OK');
    assert.equal(accesses, 0);
    assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
  });

  test('storage alone supplies no Authorization header without a session cookie', async () => {
    bff.on('get', '/me', bffError(401));
    installStorage({ 'mairie360.auth.jwt': 'stored.jwt', 'mairie360.projects.jwt': 'legacy.jwt' });
    front.cookie = undefined;

    // /me passes through the existing middleware; the /api adapter lets us
    // separately inspect the existing proxy without inventing a new route.
    await assert.rejects(requestBff('/api/user/me'));

    assert.equal(bff.requests.length, 1);
    assert.equal(bff.requests[0].headers.authorization, undefined);
  });
});

describe('protected document navigation', () => {
  test('concurrent opaque redirects reload the protected document once without inspecting their destination or body', async (t) => {
    const location = { reloads: 0, reload() { this.reloads += 1; } };
    global.window = { location };
    const requests = [];
    t.mock.method(global, 'fetch', async (path, init) => {
      requests.push({ path, init });
      return Object.defineProperties({ type: 'opaqueredirect' }, {
        status: { get() { throw new Error('opaque status must not be read'); } },
        ok: { get() { throw new Error('opaque status must not be read'); } },
        headers: { get() { throw new Error('opaque destination must not be read'); } },
        text: { get() { throw new Error('opaque body must not be read'); } },
      });
    });

    const results = await Promise.allSettled([
      requestBff('/bff/admin/roles'),
      requestBff('/bff/admin/groups'),
      requestBff('/bff/admin/sessions', { redirect: 'follow' }),
    ]);

    assert.ok(results.every(result => result.status === 'rejected' && result.reason.name === 'BffNavigationRequiredError'));
    assert.equal(location.reloads, 1);
    assert.equal(requests.length, 3);
    assert.ok(requests.every(({ init }) => init.redirect === 'manual'));
    assert.deepEqual(front.browserCalls, []);
  });

  test('an opaque redirect after a mutation never resubmits that mutation', async (t) => {
    const location = { reloads: 0, reload() { this.reloads += 1; } };
    global.window = { location };
    const requests = [];
    t.mock.method(global, 'fetch', async (path, init) => {
      requests.push({ path, init });
      return { type: 'opaqueredirect' };
    });

    await assert.rejects(requestBff('/bff/admin/groups/1', { method: 'DELETE' }), {
      name: 'BffNavigationRequiredError',
    });
    assert.equal(location.reloads, 1);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].path, '/bff/admin/groups/1');
    assert.equal(requests[0].init.method, 'DELETE');
    assert.equal(requests[0].init.redirect, 'manual');
    assert.equal(requests[0].init.body, undefined);
  });

  test('an aborted opaque response causes no document navigation', async (t) => {
    const location = { reloads: 0, reload() { this.reloads += 1; } };
    global.window = { location };
    const controller = new AbortController();
    t.mock.method(global, 'fetch', async () => {
      controller.abort();
      return { type: 'opaqueredirect' };
    });

    await assert.rejects(requestBff('/bff/admin/roles', { signal: controller.signal }), { name: 'AbortError' });
    assert.equal(location.reloads, 0);
  });

  test('ordinary 401, 403 and 503 failures are not opaque redirects and never reload the document', async (t) => {
    const location = { reloads: 0, reload() { this.reloads += 1; } };
    global.window = { location };
    let status = 401;
    t.mock.method(global, 'fetch', async () => ({
      type: 'basic', ok: false, get status() { return status; },
      get text() { throw new Error('error body must not be parsed'); },
    }));

    for (status of [401, 403, 503]) {
      await assert.rejects(requestBff('/bff/admin/roles'), {
        name: 'BffRequestError', status, message: `Erreur BFF (${status})`,
      });
    }
    assert.equal(location.reloads, 0);
  });

  test('a generic network failure does not become a session redirect', async (t) => {
    const location = { reloads: 0, reload() { this.reloads += 1; } };
    global.window = { location };
    t.mock.method(global, 'fetch', async () => { throw new TypeError('Network unavailable'); });

    await assert.rejects(requestBff('/bff/admin/roles'), { name: 'TypeError', message: 'Network unavailable' });
    assert.equal(location.reloads, 0);
  });

  test('an opaque response outside the browser rejects without accessing a missing document', async (t) => {
    delete global.window;
    t.mock.method(global, 'fetch', async () => ({ type: 'opaqueredirect' }));

    await assert.rejects(requestBff('/bff/admin/roles'), { name: 'BffNavigationRequiredError' });
  });
});

describe('stored auth token', () => {
  test('migrates the legacy projects key and formats the Bearer header once', () => {
    const store = installStorage({ 'mairie360.projects.jwt': 'legacy.jwt' });

    assert.equal(authToken.getStoredAuthorizationHeader(), 'Bearer legacy.jwt');
    assert.equal(store.get(authToken.MAIRIE360_AUTH_JWT_STORAGE_KEY), 'legacy.jwt');
    assert.equal(authToken.formatBearerToken('bearer already'), 'bearer already');
  });

  test('stores, replaces with an empty value and clears every key', () => {
    const store = installStorage({ 'mairie360.projects.jwt': 'legacy.jwt' });

    authToken.storeAuthJwtToken(' new.jwt ');
    assert.equal(store.get('mairie360.auth.jwt'), 'new.jwt');
    authToken.storeAuthJwtToken('   ');
    assert.equal(store.has('mairie360.auth.jwt'), false);
    authToken.storeAuthJwtToken('again.jwt');
    authToken.clearStoredAuthJwtToken();
    assert.equal(store.size, 0);
    assert.equal(authToken.getStoredAuthorizationHeader(), null);
  });

  test('never throws when storage is denied or when running on the server', () => {
    installStorage({}, { failing: true });
    assert.equal(authToken.getStoredAuthJwtToken(), null);
    assert.doesNotThrow(() => authToken.storeAuthJwtToken('jwt'));
    assert.doesNotThrow(() => authToken.clearStoredAuthJwtToken());

    delete global.window;
    assert.equal(authToken.getStoredAuthJwtToken(), null);
    assert.doesNotThrow(() => authToken.storeAuthJwtToken('jwt'));
    assert.doesNotThrow(() => authToken.clearStoredAuthJwtToken());
  });
});
