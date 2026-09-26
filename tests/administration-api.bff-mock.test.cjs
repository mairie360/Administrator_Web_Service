const assert = require('node:assert/strict');
const { after, afterEach, before, describe, test } = require('node:test');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer, unreachableUrl } = require('./support/contract-mock-server.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');

// Client typé src/lib/administration-api.ts exécuté de bout en bout : requestBff (navigateur) →
// middleware → catch-all src/app/[...path] → bff-proxy → faux BFF User servi en HTTP et piloté par le
// contrat du paquet publié @mairie360/bff-user-openapi. Toute requête ou réponse hors contrat fait échouer
// le test.

const contract = bffUserContract();
const bff = new ContractMockServer('BFF_USER', contract);
let front;
let administrationApi;
let BffRequestError;
const exercised = new Set();
const savedLoginUrl = process.env.LOGIN_FRONT_URL;

before(async () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ administrationApi }, { BffRequestError }] = loadTs(['src/lib/administration-api.ts', 'src/lib/bff-client.ts']);
});
after(async () => {
  if (savedLoginUrl === undefined) delete process.env.LOGIN_FRONT_URL;
  else process.env.LOGIN_FRONT_URL = savedLoginUrl;
  front.uninstall();
  await bff.stop();
});
afterEach(() => {
  bff.requests.forEach(({ method, template }) => exercised.add(`${method} ${template}`));
  const violations = [...bff.violations, ...front.violations];
  bff.reset();
  front.reset();
  assert.deepEqual(violations, []);
});

const role = (id, extra = {}) => ({ id, name: `Rôle ${id}`, description: `Description ${id}`, can_be_deleted: true, ...extra });
const group = (id, extra = {}) => ({ id, name: `Groupe ${id}`, description: null, owner_id: 1, ...extra });
const member = (id) => ({ id, first_name: 'Alice', last_name: 'Dupont', email: `user${id}@mairie.test`, phone_number: null, status: 'active', is_archived: false });
const user = (id) => ({ ...member(id), roles: [{ id: 1, name: 'Admin' }] });
const session = (id, extra = {}) => ({ id, device_info: 'Firefox', ip_address: '10.0.0.1', created_at: '2026-09-15T08:00:00Z', expires_at: '2026-09-16T08:00:00Z', revoked_at: null, ...extra });

const sequence = () => bff.requests.map(({ method, url }) => `${method} ${url.pathname}${url.search}`);

describe('administration API client against a contract-driven BFF User mock', () => {
  describe('users', () => {
    test('listUsers sends the declared pagination and trimmed search query and returns the page', async () => {
      const page = { users: [user(7), user(8)], page: 2, page_size: 20, total: 22, total_pages: 2 };
      bff.on('get', '/bff/admin/users', { body: page });

      assert.deepEqual(await administrationApi.listUsers({ page: 2, search: '  alice  ' }), page);

      assert.deepEqual(sequence(), ['GET /bff/admin/users?page=2&page_size=20&search=alice']);
      assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
      assert.equal(bff.requests[0].headers.cookie, undefined);
      assert.deepEqual(front.browserCalls, [{ method: 'GET', target: '/bff/admin/users?page=2&page_size=20&search=alice' }]);
    });

    test('listUsers omits an empty search and defaults to the first page', async () => {
      bff.on('get', '/bff/admin/users', { body: { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 } });

      assert.deepEqual(await administrationApi.listUsers(), { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 });
      assert.deepEqual(sequence(), ['GET /bff/admin/users?page=1&page_size=20']);
    });

    test('listUsers keeps only well-formed users when the BFF answers outside its contract', async () => {
      bff.on('get', '/bff/admin/users', { outOfContract: true, body: { items: [user(1), { id: 'x' }] } });

      assert.deepEqual(await administrationApi.listUsers({ page: 3 }), { users: [user(1)], page: 3, page_size: 20, total: 1, total_pages: 1 });
    });

    test('rejects invalid identifiers before any network call', async () => {
      await assert.rejects(administrationApi.listUsers({ page: 0 }), /La page doit être un entier positif/);
      assert.throws(() => administrationApi.deleteUser(-1), /L’identifiant utilisateur doit être un entier positif/);
      assert.throws(() => administrationApi.addRoleToUser(1, 1.5), /L’identifiant du rôle doit être un entier positif/);
      await assert.rejects(administrationApi.getGroup(Number.NaN), /L’identifiant du groupe/);
      assert.deepEqual(front.browserCalls, []);
      assert.deepEqual(bff.requests, []);
    });

    test('rejects inputs outside the BFF contract bounds before any network call', async () => {
      await assert.rejects(administrationApi.listUsers({ search: 'a'.repeat(101) }), /La recherche ne doit pas dépasser 100 caractères/);
      assert.throws(() => administrationApi.resetUserPassword(7, 'court12'), /Le mot de passe doit contenir au moins 8 caractères/);
      assert.throws(() => administrationApi.resetUserPassword(7, 'a'.repeat(256)), /Le mot de passe ne doit pas dépasser 255 caractères/);
      await assert.rejects(administrationApi.updateGroup(5, { name: '', description: '' }), /Le nom du groupe est obligatoire/);
      await assert.rejects(administrationApi.updateGroup(5, { name: 'a'.repeat(65), description: '' }), /Le nom du groupe ne doit pas dépasser 64 caractères/);
      await assert.rejects(administrationApi.updateGroup(5, { name: 'Élus', description: 'a'.repeat(2001) }), /La description du groupe ne doit pas dépasser 2000 caractères/);
      assert.deepEqual(front.browserCalls, []);
      assert.deepEqual(bff.requests, []);
    });
  });

  describe('reads', () => {
    test('listRoles, listGroups and the session lists unwrap their contract envelopes', async () => {
      bff.on('get', '/bff/admin/roles', { body: { roles: [role(1), role(2, { can_be_deleted: null })] } })
        .on('get', '/bff/admin/groups', { body: { groups: [group(1), group(2, { description: 'Élus' })] } })
        .on('get', '/bff/admin/sessions', { body: { sessions: [session('s-1')] } })
        .on('get', '/bff/admin/sessions/history', { body: { sessions: [session('s-1'), session('s-2', { revoked_at: '2026-09-15T09:00:00Z' })] } });

      assert.deepEqual(await administrationApi.listRoles(), [role(1), role(2, { can_be_deleted: null })]);
      assert.deepEqual(await administrationApi.listGroups(), [group(1), group(2, { description: 'Élus' })]);
      assert.deepEqual(await administrationApi.listActiveSessions(), [session('s-1')]);
      assert.equal((await administrationApi.listSessionHistory()).length, 2);
      assert.deepEqual(sequence(), ['GET /bff/admin/roles', 'GET /bff/admin/groups', 'GET /bff/admin/sessions', 'GET /bff/admin/sessions/history']);
    });

    test('getGroup and listGroupUsers target the group path parameter', async () => {
      bff.on('get', '/bff/admin/groups/{groupId}', ({ pathParams }) => ({ body: { group: group(Number(pathParams.groupId)) } }))
        .on('get', '/bff/admin/groups/{groupId}/users', { body: { users: [member(3), member(4)] } });

      assert.deepEqual(await administrationApi.getGroup(5), group(5));
      assert.deepEqual(await administrationApi.listGroupUsers(5), [member(3), member(4)]);
      assert.deepEqual(sequence(), ['GET /bff/admin/groups/5', 'GET /bff/admin/groups/5/users']);
    });

    test('tolerates bare arrays and malformed entries returned outside the contract', async () => {
      bff.on('get', '/bff/admin/roles', { outOfContract: true, body: [role(1), { id: 2 }] })
        .on('get', '/bff/admin/groups', { outOfContract: true, body: 'pas un objet' })
        .on('get', '/bff/admin/groups/{groupId}', { outOfContract: true, body: { id: 5 } });

      assert.deepEqual(await administrationApi.listRoles(), [role(1)]);
      assert.deepEqual(await administrationApi.listGroups(), []);
      assert.equal(await administrationApi.getGroup(5), null);
    });
  });

  describe('writes', () => {
    const cases = [
      ['createUser', () => administrationApi.createUser({ email: 'bob@mairie.test', first_name: 'Bob', last_name: 'Martin', password: 'MotDePasse123', phone_number: null }),
        'POST', '/bff/admin/users', { email: 'bob@mairie.test', first_name: 'Bob', last_name: 'Martin', password: 'MotDePasse123', phone_number: null }],
      ['updateUser', () => administrationApi.updateUser(7, { first_name: 'Robert' }), 'PATCH', '/bff/admin/users/7', { first_name: 'Robert' }],
      ['resetUserPassword', () => administrationApi.resetUserPassword(7, 'NouveauMotDePasse1'), 'PATCH', '/bff/admin/users/7/password', { new_password: 'NouveauMotDePasse1' }],
      ['deleteUser', () => administrationApi.deleteUser(7), 'DELETE', '/bff/admin/users/7', undefined],
      ['addRoleToUser', () => administrationApi.addRoleToUser(7, 3), 'POST', '/bff/admin/users/7/roles', { user_id: 7, role_id: 3 }],
      ['removeRoleFromUser', () => administrationApi.removeRoleFromUser(7, 3), 'DELETE', '/bff/admin/users/7/roles/3', undefined],
      ['createRole', () => administrationApi.createRole({ name: 'Agent', description: 'Agent municipal' }), 'POST', '/bff/admin/roles', { name: 'Agent', description: 'Agent municipal' }],
      ['replaceRole', () => administrationApi.replaceRole(4, { name: 'Agent', description: 'Agent', can_be_deleted: false }), 'PUT', '/bff/admin/roles/4', { name: 'Agent', description: 'Agent', can_be_deleted: false }],
      ['updateRole', () => administrationApi.updateRole(4, { description: 'Nouveau' }), 'PATCH', '/bff/admin/roles/4', { description: 'Nouveau' }],
      ['deleteRole', () => administrationApi.deleteRole(4), 'DELETE', '/bff/admin/roles/4', undefined],
      ['createGroup', () => administrationApi.createGroup({ name: 'Élus', description: '' }), 'POST', '/bff/admin/groups', { name: 'Élus', description: '' }],
      ['deleteGroup', () => administrationApi.deleteGroup(5), 'DELETE', '/bff/admin/groups/5', undefined],
      ['addUserToGroup', () => administrationApi.addUserToGroup(5, 7), 'POST', '/bff/admin/groups/5/users', { group_id: 5, user_id: 7 }],
      ['removeUserFromGroup', () => administrationApi.removeUserFromGroup(5, 7), 'DELETE', '/bff/admin/groups/5/users/7', undefined],
      ['revokeSession', () => administrationApi.revokeSession('opaque-refresh-token'), 'POST', '/bff/admin/sessions/revoke', { refresh_token: 'opaque-refresh-token' }],
    ];

    for (const [name, call, method, pathname, body] of cases) {
      test(`${name} sends a contract-valid ${method} ${pathname} with a JSON body`, async () => {
        const { template } = contract.match(method, pathname);
        bff.on(method, template, { status: 204 });

        assert.equal(await call(), undefined);

        const [request] = bff.requests;
        assert.deepEqual(sequence(), [`${method} ${pathname}`]);
        assert.deepEqual(request.body, body);
        assert.equal(request.headers['content-type'], body === undefined ? undefined : 'application/json');
        assert.equal(request.headers.accept, 'application/json');
      });
    }

    test('updateGroup returns the group sent back by the BFF, or null on an empty reply', async () => {
      bff.on('patch', '/bff/admin/groups/{groupId}', { body: { group: group(5, { name: 'Conseil' }) } });
      assert.deepEqual(await administrationApi.updateGroup(5, { name: 'Conseil', description: '' }), group(5, { name: 'Conseil' }));
      assert.deepEqual(bff.requests[0].body, { name: 'Conseil', description: '' });

      bff.on('patch', '/bff/admin/groups/{groupId}', { status: 204 });
      assert.equal(await administrationApi.updateGroup(5, { name: 'Conseil', description: '' }), null);
    });

    test('refreshSession sends the refresh token and ignores the Core response body', async () => {
      bff.on('post', '/bff/admin/sessions/refresh', { body: { message: 'JWT refreshed successfully' } });

      await administrationApi.refreshSession('opaque-refresh-token');

      assert.deepEqual(bff.requests[0].body, { refresh_token: 'opaque-refresh-token' });
    });
  });

  describe('errors', () => {
    for (const status of [400, 401, 403, 404, 502]) {
      test(`a ${status} from the BFF becomes a BffRequestError(${status})`, async () => {
        bff.on('delete', '/bff/admin/roles/{roleId}', bffError(status, 'Refusé'));

        await assert.rejects(administrationApi.deleteRole(9), (error) => error instanceof BffRequestError && error.status === status && error.message === `Erreur BFF (${status})`);
      });
    }

    test('an unreachable BFF surfaces as the proxy 502', async () => {
      const url = await unreachableUrl();
      front.useBffUrl(url);
      front.allowedOrigins.add(url);

      await assert.rejects(administrationApi.listRoles(), (error) => error instanceof BffRequestError && error.status === 502);
      assert.deepEqual(front.serverCalls.map(({ url: target }) => target.pathname), ['/bff/admin/roles']);
    });

    test('without a session cookie the middleware redirects to Login and the BFF is never called', async () => {
      front.cookie = undefined;

      await assert.rejects(administrationApi.listGroups(), (error) => error instanceof BffRequestError && error.status === 307);
      assert.deepEqual(bff.requests, []);
    });
  });

  test('every /bff/admin operation of the BFF User contract is exercised by the client', () => {
    const declared = contract.operations().filter(({ template }) => template.startsWith('/bff/admin/')).map(({ method, template }) => `${method} ${template}`);
    assert.deepEqual([...exercised].sort(), declared.sort());
  });
});
