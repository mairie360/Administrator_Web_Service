const assert = require('node:assert/strict');
const path = require('node:path');
const { after, afterEach, before, describe, test } = require('node:test');
const { OpenApiContract } = require('./support/openapi-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');

// requestBff (src/lib/bff-client.ts) et le jeton stocké côté navigateur (src/lib/auth-token.ts),
// contre le faux BFF User piloté par contracts/openapi.json.

const contract = OpenApiContract.load(path.join(__dirname, '..', 'contracts', 'openapi.json'));
const bff = new ContractMockServer('BFF_USER', contract);
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

  test('a stored JWT wins over the session cookie, and an explicit Authorization header wins over both', async () => {
    bff.on('get', '/me', { status: 401 });
    installStorage({ 'mairie360.auth.jwt': ' stored.jwt ' });

    await assert.rejects(requestBff('/me'));
    await assert.rejects(requestBff('/me', { headers: { Authorization: 'Bearer explicit.jwt' } }));

    assert.deepEqual(bff.requests.map(({ headers }) => headers.authorization), ['Bearer stored.jwt', 'Bearer explicit.jwt']);
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
