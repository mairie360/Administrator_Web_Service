const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { after, afterEach, before, describe, test } = require('node:test');
const { BFF_USER_PACKAGE, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer, METADATA_PATHS, unreachableUrl } = require('./support/contract-mock-server.cjs');
const { BFF_URL_VARIABLES, FrontHarness, ROOT, SRC, loadTs } = require('./support/front-harness.cjs');

// Garde-fou réseau du front : il ne parle qu'à un seul BFF, BFF User, et uniquement par les opérations du
// contrat publié dans le paquet @mairie360/bff-user-openapi (version exacte X.Y.Z de package.json).
// contracts/openapi.json, liste blanche du proxy et source des mocks, doit être la reconstruction exacte de
// ce paquet (scripts/orval-contract.mjs).

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const manifest = readJson('package.json');
const pinned = manifest.dependencies[BFF_USER_PACKAGE];
const contract = bffUserContract();
const bff = new ContractMockServer('BFF_USER', contract);
let front;

// Corps minimaux valides par schéma de requête du contrat.
const REQUEST_BODIES = {
  LoginView: { email: 'alice@mairie.test', password: 'MotDePasse123', device_info: 'Firefox' },
  RegisterView: { email: 'alice@mairie.test', first_name: 'Alice', last_name: 'Dupont', password: 'MotDePasse123' },
  ForceChangePasswordView: { new_password: 'NouveauMotDePasse1', token: 'force-token' },
  AdminUserPasswordResetBody: { new_password: 'NouveauMotDePasse1' },
  AdminGroupPatchBody: { name: 'Élus' },
  AdminJsonBody: {},
};

function concreteRequest({ method, template }) {
  const pathname = template.replace(/\{[^}]+\}/g, '7');
  const { schema } = contract.requestBodySchema(contract.match(method, pathname));
  const body = schema ? REQUEST_BODIES[schema.$ref.split('/').pop()] : undefined;
  if (schema && !body) throw new Error(`Aucun corps d'exemple pour ${method} ${template}`);
  return { pathname, body };
}

/** Répond 200 sans corps à toute opération du contrat publié. */
function answerEveryOperation() {
  for (const { method, template } of contract.operations()) bff.on(method, template, { status: 200, outOfContract: true });
}

before(async () => {
  await bff.start();
  front = new FrontHarness({ bff }).install();
});
after(async () => {
  front.uninstall();
  await bff.stop();
});
afterEach(() => {
  const violations = [...bff.violations, ...front.violations];
  bff.reset();
  front.reset();
  assert.deepEqual(violations, []);
});

describe('published BFF User contract', () => {
  test(`${BFF_USER_PACKAGE} is pinned to an exact published X.Y.Z version, installed as locked`, () => {
    assert.match(pinned ?? '', /^\d+\.\d+\.\d+$/, `${BFF_USER_PACKAGE} doit être épinglé à une version exacte (pas de plage ni de pré-version)`);
    assert.equal(readJson(`node_modules/${BFF_USER_PACKAGE}/package.json`).version, pinned);
    assert.equal(readJson('package-lock.json').packages[`node_modules/${BFF_USER_PACKAGE}`].version, pinned);
  });

  test('BFF User is the only BFF contract package', () => {
    const all = { ...manifest.dependencies, ...manifest.devDependencies };
    assert.deepEqual(Object.keys(all).filter((name) => /^@mairie360\/bff-.*-openapi$/.test(name)), [BFF_USER_PACKAGE]);
  });

  test('contracts/openapi.json is exactly the contract rebuilt from the installed package', async () => {
    const { buildOrvalOpenApi } = await import('../scripts/orval-contract.mjs');
    const snapshot = readJson('contracts/openapi.json');

    assert.equal(snapshot.info['x-source-package'], `${BFF_USER_PACKAGE}@${pinned}`);
    assert.equal(snapshot.info.title, 'bff_user');
    assert.deepEqual(snapshot, buildOrvalOpenApi(BFF_USER_PACKAGE, ROOT));
  });

  test('every Docker stack starts BFF User as its only BFF', () => {
    for (const file of fs.readdirSync(ROOT).filter((name) => /^docker-compose.*\.ya?ml$/.test(name))) {
      const images = [...fs.readFileSync(path.join(ROOT, file), 'utf8').matchAll(/ghcr\.io\/mairie360\/(bff-[\w-]+):/g)].map(([, name]) => name);
      assert.ok(images.every((name) => name === 'bff-user'), `${file} : ${images.join(', ')}`);
    }
  });

  test('the mock reports requests that break the contract', async () => {
    const response = await fetch(`${bff.url}/bff/admin/users/abc/password?debug=1`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_password: 'court' }) });
    const unknown = await fetch(`${bff.url}/bff/admin/logs`);

    assert.equal(response.status, 500);
    assert.equal(unknown.status, 404);
    assert.deepEqual(bff.violations.splice(0), [
      '[BFF_USER] requête PATCH /bff/admin/users/abc/password?debug=1 : path.userId: type number attendu, reçu string',
      '[BFF_USER] requête PATCH /bff/admin/users/{userId}/password : paramètre query "debug" non déclaré',
      '[BFF_USER] requête PATCH /bff/admin/users/{userId}/password $body.new_password: longueur < 8',
      '[BFF_USER] appel non mocké : PATCH /bff/admin/users/{userId}/password',
      '[BFF_USER] requête GET /bff/admin/logs : GET /bff/admin/logs n\'existe pas dans le contrat bff_user',
    ]);
  });
});

describe('a single BFF', () => {
  test('the proxy and the session adapters resolve the same BFF URL, whichever variable sets it', async () => {
    answerEveryOperation();

    for (const variable of BFF_URL_VARIABLES) {
      front.useBffUrl(bff.url, variable);
      await front.browserFetch('/api/user/me');
      await front.browserFetch('/api/auth/logout', { method: 'POST' });
      await front.browserFetch('/bff/admin/roles');
    }

    assert.equal(bff.requests.length, BFF_URL_VARIABLES.length * 3);
    assert.deepEqual([...new Set(front.serverCalls.map(({ url }) => url.origin))], [bff.url]);
  });

  test('a higher-priority variable redirects every call, adapters included, to that one BFF', async () => {
    const other = await unreachableUrl();
    front.allowedOrigins.add(other);
    process.env.USER_BFF_URL = bff.url;
    process.env.BFF_ADMIN_BASE_URL = other;

    await front.browserFetch('/api/user/me');
    await front.browserFetch('/bff/admin/roles');

    assert.deepEqual(bff.requests, []);
    assert.deepEqual(front.serverCalls.map(({ url }) => `${url.origin}${url.pathname}`), [`${other}/me`, `${other}/bff/admin/roles`]);
  });

  test('only src/lib/bff-proxy.ts reads the BFF URL from the environment', () => {
    const readers = sourceFiles(SRC).filter((file) => /process\.env\.[A-Z_]*BFF/.test(fs.readFileSync(file, 'utf8'))).map((file) => path.relative(ROOT, file));
    assert.deepEqual(readers, ['src/lib/bff-proxy.ts']);
  });
});

function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [full] : [];
  });
}

describe('catch-all proxy src/app/[...path]', () => {
  test('forwards every contract operation to the same BFF operation', async () => {
    answerEveryOperation();

    for (const operation of contract.operations()) {
      const { pathname, body } = concreteRequest(operation);
      const response = await front.browserFetch(pathname, {
        method: operation.method,
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      });
      assert.ok(response.status < 300, `${operation.method} ${pathname} → ${response.status}`);
    }

    assert.deepEqual(
      bff.requests.map(({ method, template }) => `${method} ${template}`),
      contract.operations().map(({ method, template }) => `${method} ${template}`),
    );
  });

  test('keeps declared query parameters and strips cookies and middleware headers', async () => {
    bff.on('get', '/bff/admin/users', { body: { users: [], page: 1, page_size: 5, total: 0, total_pages: 0 } });

    await front.browserFetch('/bff/admin/users?page=1&page_size=5&search=a%26b');

    const [request] = bff.requests;
    assert.equal(request.url.search, '?page=1&page_size=5&search=a%26b');
    assert.equal(request.headers.cookie, undefined);
    assert.equal(request.headers['x-nonce'], undefined);
    assert.equal(request.headers['content-security-policy'], undefined);
    assert.equal(request.headers.authorization, `Bearer ${front.cookie}`);
  });

  test('HEAD on a GET operation is forwarded without a body', async () => {
    bff.on('get', '/health', {});

    const response = await front.browserFetch('/health', { method: 'HEAD' });

    assert.equal(response.status, 200);
    assert.equal(await response.text(), '');
    assert.deepEqual(bff.requests.map(({ method, template }) => `${method} ${template}`), ['HEAD /health']);
  });

  for (const [label, target, method, status] of [
    ['an undeclared path', '/bff/admin/logs', 'GET', 404],
    ['an undeclared nested path', '/bff/admin/users/7/archive', 'POST', 404],
    ['the Swagger UI', '/docs', 'GET', 404],
    ['an undeclared method', '/bff/admin/sessions/history', 'DELETE', 405],
    ['a PUT on a PATCH-only operation', '/bff/admin/users/7', 'PUT', 405],
    ['a traversal resolved by the URL parser', '/bff/admin/%2E%2E/%2E%2E/me/x', 'GET', 404],
    ['an encoded slash', '/bff/admin/users/7%2Fpassword', 'PATCH', 400],
    ['an /api path without adapter', '/api/unknown', 'GET', 404],
  ]) {
    test(`rejects ${label} (${method} ${target}) with ${status} before any network call`, async () => {
      const response = await front.browserFetch(target, { method });

      assert.equal(response.status, status);
      if (status === 405) assert.ok(response.headers.get('allow'));
      assert.deepEqual(front.serverCalls, []);
      assert.deepEqual(bff.requests, []);
    });
  }

  test('rejects dot segments that reach the handler with 400', async () => {
    const [{ proxyBffRequest }] = loadTs(['src/lib/bff-proxy.ts']);
    const { NextRequest } = require('next/server');

    for (const segments of [['bff', '..', 'me'], ['.'], ['health', '']]) {
      const response = await proxyBffRequest(new NextRequest('http://administration.mairie360.test/'), { params: Promise.resolve({ path: segments }) });
      assert.equal(response.status, 400);
    }
    assert.deepEqual(front.serverCalls, []);
  });

  test('only the BFF self-description documents are relayed outside the contract', async () => {
    for (const documentPath of METADATA_PATHS) {
      const response = await front.browserFetch(documentPath);
      assert.equal((await response.json()).info.title, 'bff_user');
    }
    const post = await front.browserFetch('/openapi.json', { method: 'POST', body: '{}' });

    assert.equal(post.status, 405);
    assert.deepEqual(bff.requests.map(({ method, template, metadata }) => [method, template, metadata]), METADATA_PATHS.map((documentPath) => ['GET', documentPath, true]));
  });
});

describe('route handlers src/app/api', () => {
  test('every exported handler forwards only to a contract operation', async () => {
    answerEveryOperation();
    const adapters = front.routes.filter(({ catchAll }) => !catchAll);
    assert.ok(adapters.length > 0);

    for (const { prefix, module } of adapters) {
      for (const method of Object.keys(module).filter((name) => /^[A-Z]+$/.test(name))) {
        bff.requests.length = 0;
        const response = await front.browserFetch(prefix, { method });
        assert.ok(response.status < 300, `${method} ${prefix} → ${response.status}`);
        assert.equal(bff.requests.length, 1, `${method} ${prefix} doit appeler exactement une opération du contrat`);
      }
    }
  });
});

describe('no network access outside the BFF contract', () => {
  const sources = sourceFiles;
  const relative = (file) => path.relative(ROOT, file);

  test('only the BFF client, the session hook and the proxy call fetch, and no other network API is used', () => {
    const offenders = [];
    const fetchers = [];
    for (const file of sources(SRC)) {
      const code = fs.readFileSync(file, 'utf8');
      if (/\bfetch\s*\(/.test(code)) fetchers.push(relative(file));
      for (const api of ['XMLHttpRequest', 'WebSocket', 'EventSource', 'sendBeacon', 'axios', 'navigator.serviceWorker', 'new Worker']) {
        if (code.includes(api)) offenders.push(`${relative(file)} : ${api}`);
      }
      if (/https?:\/\/(?!localhost[:/])[^\s'"`]+/.test(code.replace(/^\s*(\/\/|\*).*$/gm, ''))) offenders.push(`${relative(file)} : URL absolue`);
    }
    assert.deepEqual(offenders, []);
    assert.deepEqual(fetchers.sort(), ['src/lib/auth-session.ts', 'src/lib/bff-client.ts', 'src/lib/bff-proxy.ts']);
  });

  test('browser-side fetch targets are same-origin adapters and admin calls use the declared /bff/admin prefix', () => {
    const session = fs.readFileSync(path.join(SRC, 'lib', 'auth-session.ts'), 'utf8');
    const targets = [...session.matchAll(/\bfetch\s*\(\s*(['"`])([^'"`]+)\1/g)].map((match) => match[2]);
    const adapters = front.routes.filter(({ catchAll }) => !catchAll).map(({ prefix }) => prefix);
    assert.deepEqual(targets, ['/api/user/me', '/api/auth/logout']);
    targets.forEach((target) => assert.ok(adapters.includes(target), `${target} n'a pas de route handler`));

    const admin = fs.readFileSync(path.join(SRC, 'lib', 'administration-api.ts'), 'utf8');
    assert.match(admin, /const ADMIN_BASE_PATH = "\/bff\/admin";/);
    const callers = sources(SRC).filter((file) => /\brequestBff\s*[<(]/.test(fs.readFileSync(file, 'utf8'))).map(relative);
    assert.deepEqual(callers.sort(), ['src/lib/administration-api.ts', 'src/lib/bff-client.ts']);
  });

  test('the browser may only connect to its own origin and Next.js rewrites nothing elsewhere', () => {
    const [{ buildContentSecurityPolicy }] = loadTs(['src/lib/content-security-policy.ts']);
    const nextConfig = loadTs(['next.config.ts'])[0].default;
    const directives = Object.fromEntries(buildContentSecurityPolicy('n').split('; ').map((directive) => [directive.split(' ')[0], directive]));

    assert.equal(directives['connect-src'], "connect-src 'self'");
    assert.equal(directives['default-src'], "default-src 'self'");
    assert.equal(nextConfig.rewrites, undefined);
    assert.equal(nextConfig.redirects, undefined);
  });

  test('the published @mairie360/lib-components bundle performs no network call of its own', () => {
    const bundle = fs.readFileSync(require.resolve('@mairie360/lib-components'), 'utf8');
    for (const api of [/\bfetch\s*\(/, /XMLHttpRequest/, /WebSocket/, /EventSource/, /sendBeacon/]) assert.doesNotMatch(bundle, api);
  });
});
