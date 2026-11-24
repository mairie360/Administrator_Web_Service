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
let administrationApi, administrationErrorMessage;
let BffRequestError;
const exercised = new Set();
const savedLoginUrl = process.env.LOGIN_FRONT_URL;

before(async () => {
  process.env.LOGIN_FRONT_URL = 'https://login.mairie.test/';
  await bff.start();
  front = new FrontHarness({ bff }).install();
  [{ administrationApi }, { BffRequestError }, { administrationErrorMessage }] = loadTs(['src/lib/administration-api.ts', 'src/lib/bff-client.ts', 'src/lib/administration-error.ts']);
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
const user = (id) => ({ ...member(id), roles: [{ id: 1, name: 'Admin' }], account_status: 'active', active_sessions: 0, last_login_at: null, two_factor: { methods: [], last_verified_at: null } });
const session = (id, extra = {}) => ({ id, device_info: 'Firefox', ip_address: '10.0.0.1', created_at: '2026-09-15T08:00:00Z', expires_at: '2026-09-16T08:00:00Z', revoked_at: null, ...extra });

const sequence = () => bff.requests.map(({ method, url }) => `${method} ${url.pathname}${url.search}`);

describe('administration API client against a contract-driven BFF User mock', () => {
  describe('users', () => {
    test('listUsers sends the declared pagination and trimmed search query and returns the page', async () => {
      const page = { users: [user(7), user(8)], page: 2, page_size: 6, total: 8, total_pages: 2 };
      bff.on('get', '/admin/users', { body: page });

      assert.deepEqual(await administrationApi.listUsers({ page: 2, search: '  alice  ' }), page);

      assert.deepEqual(sequence(), ['GET /admin/users?page=2&page_size=6&search=alice']);
      assert.equal(bff.requests[0].headers.authorization, `Bearer ${front.cookie}`);
      assert.equal(bff.requests[0].headers.cookie, undefined);
      assert.deepEqual(front.browserCalls, [{ method: 'GET', target: '/admin/users?page=2&page_size=6&search=alice' }]);
    });

    test('listUsers omits an empty search and defaults to the first page of 6 rows (MAIR-904)', async () => {
      bff.on('get', '/admin/users', { body: { users: [], page: 1, page_size: 6, total: 0, total_pages: 0 } });

      assert.deepEqual(await administrationApi.listUsers(), { users: [], page: 1, page_size: 6, total: 0, total_pages: 0 });
      assert.deepEqual(sequence(), ['GET /admin/users?page=1&page_size=6']);
    });

    test('MAIR-904 listUsers sends the state and role filters and the descending order', async () => {
      bff.on('get', '/admin/users', { body: { users: [{ ...user(3), account_status: 'suspended' }], page: 1, page_size: 6, total: 1, total_pages: 1 } });

      const page = await administrationApi.listUsers({ status: 'suspended', roleId: 4, sort: '-name' });
      assert.equal(page.users[0].account_status, 'suspended');
      assert.deepEqual(sequence(), ['GET /admin/users?page=1&page_size=6&account_status=suspended&role_id=4&sort=-name']);
    });

    test('MAIR-584 / MAIR-904 sessions of a user, sign-out, suspension and reactivation', async () => {
      const sid = '4f7c2a9e-8d31-4c55-9a0b-3e1f6d2c8b70';
      bff.on('get', '/admin/users/{userId}/sessions', { body: { sessions: [session(sid)] } })
        .on('delete', '/admin/users/{userId}/sessions/{sessionId}', { status: 204 })
        .on('delete', '/admin/users/{userId}/sessions', { status: 204 })
        .on('post', '/admin/users/{userId}/suspend', { status: 204 })
        .on('post', '/admin/users/{userId}/reactivate', { status: 204 });

      assert.deepEqual(await administrationApi.listUserSessions(7), [session(sid)]);
      await administrationApi.revokeUserSession(7, sid);
      await administrationApi.revokeUserSessions(7);
      await administrationApi.suspendUser(7);
      await administrationApi.reactivateUser(7);
      assert.deepEqual(sequence(), [
        'GET /admin/users/7/sessions', `DELETE /admin/users/7/sessions/${sid}`, 'DELETE /admin/users/7/sessions', 'POST /admin/users/7/suspend', 'POST /admin/users/7/reactivate',
      ]);
    });

    test('MAIR-824 security tab: the policy, its update and the reset of an agent', async () => {
      const policy = { required: false, totp_allowed: true, passkey_allowed: false, backup_codes_allowed: true };
      bff.on('get', '/admin/two-factor-policy', { body: { ...policy, updated_by: null, updated_at: '2026-11-17T09:30:00Z' } })
        .on('put', '/admin/two-factor-policy', { body: { ...policy, required: true, updated_by: 1, updated_at: '2026-11-17T09:31:00Z' } })
        .on('delete', '/admin/users/{userId}/2fa', { status: 204 });

      assert.deepEqual(await administrationApi.getTwoFactorPolicy(), policy);
      assert.deepEqual(await administrationApi.updateTwoFactorPolicy({ ...policy, required: true }), { ...policy, required: true });
      await administrationApi.resetUserTwoFactor(7);
      assert.deepEqual(sequence(), ['GET /admin/two-factor-policy', 'PUT /admin/two-factor-policy', 'DELETE /admin/users/7/2fa']);
    });

    test('MAIR-773 security tab: the recent alerts and the sign-in journal of an agent', async () => {
      const alert = { id: 12, level: 'certain', ip_address: '92.184.10.1', device_info: 'Firefox', created_at: '2026-11-23T08:12:00+00:00', acknowledged_at: null, user: { id: 7, first_name: 'Bob', last_name: 'Martin' } };
      const line = { action: 'STOLEN_SESSION_ATTEMPT', session_id: '4f7c2a9e-8d31-4c55-9a0b-3e1f6d2c8b70', ip_address: '92.184.10.1', device_info: 'Firefox', occurred_at: '2026-11-23T08:12:00+00:00' };
      bff.on('get', '/admin/security-alerts', { body: [alert] })
        .on('get', '/admin/users/{userId}/connection-logs', { body: [line] });

      assert.deepEqual(await administrationApi.listSecurityAlerts(), [{
        id: 12, level: 'certain', ipAddress: '92.184.10.1', deviceInfo: 'Firefox', createdAt: '2026-11-23T08:12:00+00:00', acknowledgedAt: null,
        user: { id: 7, firstName: 'Bob', lastName: 'Martin' },
      }]);
      assert.deepEqual(await administrationApi.listConnectionLogs(7), [{
        action: 'STOLEN_SESSION_ATTEMPT', sessionId: '4f7c2a9e-8d31-4c55-9a0b-3e1f6d2c8b70', ipAddress: '92.184.10.1', deviceInfo: 'Firefox', occurredAt: '2026-11-23T08:12:00+00:00',
      }]);
      assert.deepEqual(sequence(), ['GET /admin/security-alerts', 'GET /admin/users/7/connection-logs']);
      await assert.rejects(administrationApi.listConnectionLogs(0), /L’identifiant utilisateur/);
    });

    test('MAIR-923 F21 the projects left without a group', async () => {
      bff.on('get', '/admin/projects-without-group', { body: { total: 1, projects: [{ id: 'project-9', title: 'LED', createdAt: null }] } });

      assert.deepEqual(await administrationApi.listProjectsWithoutGroup(), { total: 1, projects: [{ id: 'project-9', title: 'LED', createdAt: null }] });
    });

    test('listUsers refuses an incoherent receipt rather than confirming a partial page', async () => {
      bff.on('get', '/admin/users', { outOfContract: true, body: { items: [user(1), { id: 'x' }] } });

      await assert.rejects(administrationApi.listUsers({ page: 3 }), /incohérentes/);
    });

    test('rejects invalid identifiers before any network call', async () => {
      await assert.rejects(administrationApi.listUsers({ page: 0 }), /La page doit être un entier positif/);
      assert.throws(() => administrationApi.deleteUser(-1), /L’identifiant utilisateur doit être un entier positif/);
      assert.throws(() => administrationApi.addRoleToUser(1, 1.5), /L’identifiant du rôle doit être un entier positif/);
      await assert.rejects(administrationApi.getGroup(Number.NaN), /L’identifiant du groupe/);
      assert.deepEqual(front.browserCalls, []);
      assert.deepEqual(bff.requests, []);
    });

    test('MAIR-757 a password Core API refuses (400 without details) shows the whole policy', async () => {
      const policy = /utilisez au moins 12 caractères, évitez les mots de passe courants et n’y mettez ni l’adresse e-mail, ni le prénom, ni le nom de l’utilisateur\./;
      const refused = (details) => ({ status: 400, body: { error: { code: 'BAD_REQUEST', message: 'Bad request', details } }, outOfContract: true });
      bff.on('patch', '/admin/users/{userId}/password', refused([]));
      await assert.rejects(administrationApi.resetUserPassword(7, 'NouveauMotDePasse1'), (error) => {
        assert.match(administrationErrorMessage(error), policy);
        assert.doesNotMatch(administrationErrorMessage(error), /téléphone/);
        return true;
      });
      bff.on('post', '/admin/users', refused([]));
      await assert.rejects(administrationApi.createUser({ email: 'camille.lefebvre@mairie.test', first_name: 'Camille', last_name: 'Lefebvre', password: 'MotDePasse123', phone_number: '06 12 34 56 78' }), (error) => {
        assert.match(administrationErrorMessage(error), policy);
        assert.match(administrationErrorMessage(error), /Vérifiez aussi le numéro de téléphone\./);
        return true;
      });
      // A 400 with field details keeps its field-level message.
      bff.on('post', '/admin/users', refused([{ path: 'body.email', message: 'Invalid email' }]));
      await assert.rejects(administrationApi.createUser({ email: 'camille.lefebvre@mairie.test', first_name: 'Camille', last_name: 'Lefebvre', password: 'MotDePasse123' }), (error) => {
        assert.doesNotMatch(administrationErrorMessage(error), policy);
        assert.match(administrationErrorMessage(error), /Vérifiez les champs signalés/);
        return true;
      });
    });

    test('rejects inputs outside the BFF contract bounds before any network call', async () => {
      await assert.rejects(administrationApi.listUsers({ search: 'a'.repeat(101) }), /La recherche ne doit pas dépasser 100 caractères/);
      assert.throws(() => administrationApi.resetUserPassword(7, 'court12'), /Le mot de passe doit contenir au moins 12 caractères/);
      assert.throws(() => administrationApi.resetUserPassword(7, 'a'.repeat(256)), /Le mot de passe ne doit pas dépasser 255 caractères/);
      // MAIR-757: the temporary password of a new account is checked before the call too.
      await assert.rejects(administrationApi.createUser({ email: 'camille.lefebvre@mairie.test', first_name: 'Camille', last_name: 'Lefebvre', password: 'court12' }), /Le mot de passe doit contenir au moins 12 caractères/);
      await assert.rejects(administrationApi.updateGroup(5, { name: '', description: '' }), /Le nom du groupe est obligatoire/);
      await assert.rejects(administrationApi.updateGroup(5, { name: 'a'.repeat(65), description: '' }), /Le nom du groupe ne doit pas dépasser 64 caractères/);
      await assert.rejects(administrationApi.updateGroup(5, { name: 'Élus', description: 'a'.repeat(2001) }), /La description du groupe ne doit pas dépasser 2000 caractères/);
      assert.deepEqual(front.browserCalls, []);
      assert.deepEqual(bff.requests, []);
    });
  });

  describe('reads', () => {
    test('listRoles, listGroups and the session lists unwrap their contract envelopes', async () => {
      bff.on('get', '/admin/roles', { body: { roles: [role(1), role(2, { can_be_deleted: null })] } })
        .on('get', '/admin/groups', { body: { groups: [group(1), group(2, { description: 'Élus' })] } })
        .on('get', '/admin/sessions', { body: { sessions: [session('s-1')] } })
        .on('get', '/admin/sessions/history', { body: { sessions: [session('s-1'), session('s-2', { revoked_at: '2026-09-15T09:00:00Z' })] } });

      assert.deepEqual(await administrationApi.listRoles(), [role(1), role(2, { can_be_deleted: null })]);
      assert.deepEqual(await administrationApi.listGroups(), [group(1), group(2, { description: 'Élus' })]);
      assert.deepEqual(await administrationApi.listActiveSessions(), [session('s-1')]);
      assert.equal((await administrationApi.listSessionHistory()).length, 2);
      assert.deepEqual(sequence(), ['GET /admin/roles', 'GET /admin/groups', 'GET /admin/sessions', 'GET /admin/sessions/history']);
    });

    test('getGroup and listGroupUsers target the group path parameter', async () => {
      bff.on('get', '/admin/groups/{groupId}', ({ pathParams }) => ({ body: { group: group(Number(pathParams.groupId)) } }))
        .on('get', '/admin/groups/{groupId}/users', { body: { users: [member(3), member(4)] } });

      assert.deepEqual(await administrationApi.getGroup(5), group(5));
      assert.deepEqual(await administrationApi.listGroupUsers(5), [member(3), member(4)]);
      assert.deepEqual(sequence(), ['GET /admin/groups/5', 'GET /admin/groups/5/users']);
    });

    test('refuses malformed list envelopes without converting them to confirmed empty collections', async () => {
      bff.on('get', '/admin/roles', { outOfContract: true, body: [role(1), { id: 2 }] })
        .on('get', '/admin/groups', { outOfContract: true, body: 'pas un objet' })
        .on('get', '/admin/groups/{groupId}', { outOfContract: true, body: { id: 5 } });

      await assert.rejects(administrationApi.listRoles(), /incohérentes/);
      await assert.rejects(administrationApi.listGroups(), /incohérentes/);
      assert.equal(await administrationApi.getGroup(5), null);
    });
  });

  describe('writes', () => {
    const cases = [
      ['updateUser', () => administrationApi.updateUser(7, { first_name: 'Robert' }), 'PATCH', '/admin/users/7', { first_name: 'Robert' }],
      ['resetUserPassword', () => administrationApi.resetUserPassword(7, 'NouveauMotDePasse1'), 'PATCH', '/admin/users/7/password', { new_password: 'NouveauMotDePasse1' }],
      ['deleteUser', () => administrationApi.deleteUser(7), 'DELETE', '/admin/users/7', undefined],
      ['addRoleToUser', () => administrationApi.addRoleToUser(7, 3), 'POST', '/admin/users/7/roles', { user_id: 7, role_id: 3 }],
      ['removeRoleFromUser', () => administrationApi.removeRoleFromUser(7, 3), 'DELETE', '/admin/users/7/roles/3', undefined],
      ['createRole', () => administrationApi.createRole({ name: 'Agent', description: 'Agent municipal' }), 'POST', '/admin/roles', { name: 'Agent', description: 'Agent municipal' }],
      ['replaceRole', () => administrationApi.replaceRole(4, { name: 'Agent', description: 'Agent', can_be_deleted: false }), 'PUT', '/admin/roles/4', { name: 'Agent', description: 'Agent', can_be_deleted: false }],
      ['updateRole', () => administrationApi.updateRole(4, { description: 'Nouveau' }), 'PATCH', '/admin/roles/4', { description: 'Nouveau' }],
      ['deleteRole', () => administrationApi.deleteRole(4), 'DELETE', '/admin/roles/4', undefined],
      ['createGroup', () => administrationApi.createGroup({ name: 'Élus', description: '' }), 'POST', '/admin/groups', { name: 'Élus', description: '' }],
      ['deleteGroup', () => administrationApi.deleteGroup(5), 'DELETE', '/admin/groups/5', undefined],
      ['addUserToGroup', () => administrationApi.addUserToGroup(5, 7), 'POST', '/admin/groups/5/users', { group_id: 5, user_id: 7 }],
      ['removeUserFromGroup', () => administrationApi.removeUserFromGroup(5, 7), 'DELETE', '/admin/groups/5/users/7', undefined],
      // MAIR-923: the service of an agent, and the deletion of a service.
      ['setUserService', () => administrationApi.setUserService(7, 3), 'PUT', '/admin/users/7/service', { service_id: 3 }],
      ['setUserService', () => administrationApi.setUserService(7, null), 'PUT', '/admin/users/7/service', { service_id: null }],
      ['deleteService', () => administrationApi.deleteService(3), 'DELETE', '/admin/services/3', undefined],
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

    test('createUser sends a contract-valid POST /admin/users and answers the id of the account', async () => {
      const input = { email: 'bob@mairie.test', first_name: 'Bob', last_name: 'Martin', password: 'MotDePasse123', phone_number: null };
      bff.on('post', '/admin/users', { status: 201, body: { id: 12, message: 'User created successfully!' } });
      assert.equal(await administrationApi.createUser(input), 12);
      assert.deepEqual(bff.requests[0].body, input);
      assert.equal(bff.requests[0].headers['content-type'], 'application/json');

      bff.on('post', '/admin/users', { status: 201, body: { message: 'User created successfully!' } });
      assert.equal(await administrationApi.createUser(input), null);
    });

    test('MAIR-923 lists, creates and renames the services of the mairie', async () => {
      const voirie = { id: 3, name: 'Voirie', created_at: '2026-11-20T08:00:00Z', agents: 2 };
      bff.on('get', '/admin/services', { body: { services: [voirie] } });
      assert.deepEqual(await administrationApi.listServices(), [voirie]);

      bff.on('post', '/admin/services', { status: 201, body: { ...voirie, id: 4, name: 'Culture', agents: 0 } });
      assert.deepEqual(await administrationApi.createService('  Culture '), { ...voirie, id: 4, name: 'Culture', agents: 0 });

      bff.on('patch', '/admin/services/{serviceId}', { body: { ...voirie, name: 'Voirie et réseaux' } });
      assert.equal((await administrationApi.renameService(3, 'Voirie et réseaux')).name, 'Voirie et réseaux');

      assert.deepEqual(sequence(), ['GET /admin/services', 'POST /admin/services', 'PATCH /admin/services/3']);
      assert.deepEqual(bff.requests.map(({ body }) => body), [undefined, { name: 'Culture' }, { name: 'Voirie et réseaux' }]);
      await assert.rejects(administrationApi.createService('  '), /obligatoire/);
    });

    test('updateGroup returns the group sent back by the BFF, or null on an empty reply', async () => {
      bff.on('patch', '/admin/groups/{groupId}', { body: { group: group(5, { name: 'Conseil' }) } });
      assert.deepEqual(await administrationApi.updateGroup(5, { name: 'Conseil', description: '' }), group(5, { name: 'Conseil' }));
      assert.deepEqual(bff.requests[0].body, { name: 'Conseil', description: '' });

      bff.on('patch', '/admin/groups/{groupId}', { status: 204 });
      assert.equal(await administrationApi.updateGroup(5, { name: 'Conseil', description: '' }), null);
    });


  });

  describe('errors', () => {
    for (const status of [400, 401, 403, 404, 502]) {
      test(`a ${status} from the BFF becomes a BffRequestError(${status})`, async () => {
        bff.on('delete', '/admin/roles/{roleId}', bffError(status, 'Refusé'));

        await assert.rejects(administrationApi.deleteRole(9), (error) => error instanceof BffRequestError && error.status === status && error.message === `Erreur BFF (${status})`);
      });
    }

    test('an unreachable BFF surfaces as the proxy 502', async () => {
      const url = await unreachableUrl();
      front.useBffUrl(url);
      front.allowedOrigins.add(url);

      await assert.rejects(administrationApi.listRoles(), (error) => error instanceof BffRequestError && error.status === 502);
      assert.deepEqual(front.serverCalls.map(({ url: target }) => target.pathname), ['/admin/roles']);
    });

    test('without a session cookie the API reports the actual BFF401 without page middleware', async () => {
      front.cookie = undefined;
      bff.on('get', '/admin/groups', bffError(401));
      await assert.rejects(administrationApi.listGroups(), (error) => error instanceof BffRequestError && error.status === 401);
      assert.equal(bff.requests.length, 1);
      assert.equal(bff.requests[0].headers.authorization, undefined);
    });
  });

  test('every retained administration client operation is exercised; retired token session writes stay unavailable', () => {
    // MAIR-406 keeps read-only lists and retires token consumers. Neither the
    // browser client nor the frontend proxy exposes those retired operations.
    const retired = new Set(['/admin/sessions/refresh', '/admin/sessions/revoke']);
    const declared = contract.operations().filter(({ template }) => template.startsWith('/admin/') && !retired.has(template)).map(({ method, template }) => `${method} ${template}`);
    assert.deepEqual([...exercised].sort(), declared.sort());
  });
});
