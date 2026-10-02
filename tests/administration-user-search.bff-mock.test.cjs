const assert = require('node:assert/strict');
const { test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const { bffError, bffUserContract } = require('./support/bff-user-contract.cjs');
const { FrontHarness, loadTs } = require('./support/front-harness.cjs');

installReactRuntime();
const React = require('react');
const [{ AdministrationConsole }, { administrationApi }] = loadTs([
  'src/components/administration-console.tsx', 'src/lib/administration-api.ts',
]);
const person = (id, first) => ({ id, first_name: first, last_name: 'Recette',
  email: `person${id}@mairie.test`, phone_number: null, status: 'active',
  is_archived: false, roles: [] });
const alice = person(7, 'Alice');
const bob = person(8, 'Bob');
const usersPage = (users, extra = {}) => ({ users, page: 1, page_size: 20,
  total: users.length, total_pages: 1, ...extra });
const response = (users, extra) => ({ body: usersPage(users, extra) });
const unavailable = 'Le service d’administration est momentanément indisponible.';

// Real component and HTTP/contract harness; the observer records completion of
// the ordinary parsed API promise, without replacing its response or request.
async function withConsole(handler, run) {
  const bff = new ContractMockServer('BFF_USER', bffUserContract());
  await bff.start();
  const front = new FrontHarness({ bff }).install();
  const originalList = administrationApi.listUsers;
  const completed = [];
  const releases = [];
  let view;
  const deferred = () => {
    let resolve;
    const promise = new Promise(done => { resolve = done; });
    releases.push(resolve);
    return { promise, resolve };
  };
  try {
    global.window = { requestAnimationFrame: callback => callback(),
      localStorage: { getItem: () => null } };
    administrationApi.listUsers = async options => {
      try { return await originalList(options); }
      finally { completed.push({ ...options }); }
    };
    bff.on('GET', '/bff/admin/roles', { body: { roles: [] } });
    bff.on('GET', '/bff/admin/groups', { body: { groups: [] } });
    bff.on('GET', '/bff/admin/sessions', { body: { sessions: [] } });
    bff.on('GET', '/bff/admin/sessions/history', { body: { sessions: [] } });
    const reply = handler(deferred);
    bff.on('GET', '/bff/admin/users', reply);
    view = mount(React.createElement(AdministrationConsole));
    await view.waitFor(() => completed.length > 0 &&
      view.hostElements('Actualiser')[0]?.props.disabled === false);
    const search = async value => {
      await view.fire(props => props.type === 'search', 'onChange', { target: { value } });
      await view.fire(props => props.role === 'search', 'onSubmit');
    };
    await run({ view, bff, search, completed });
    assert.deepEqual([...bff.violations, ...front.violations], []);
  } finally {
    view?.unmount();
    for (const release of releases) release(response([]));
    administrationApi.listUsers = originalList;
    delete global.window;
    front.uninstall();
    await bff.stop();
  }
}

test('a late earlier search cannot replace the latest rows, total or page', async () => {
  let earlier;
  await withConsole(deferred => {
    earlier = deferred();
    return request => request.url.searchParams.get('search') === 'Alice'
      ? earlier.promise : response(request.url.searchParams.get('search') === 'Bob' ? [bob] : [alice, bob]);
  }, async ({ view, bff, search, completed }) => {
    await search('Alice');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await search('Bob');
    await view.waitFor(() => completed.some(item => item.search === 'Bob') && view.text().includes('Bob Recette'));
    earlier.resolve(response([alice], { total: 99, total_pages: 5 }));
    await view.waitFor(() => completed.some(item => item.search === 'Alice'));
    assert.match(view.html, /type="search"[^>]*value="Bob"/);
    assert.match(view.text(), /Bob Recette/);
    assert.doesNotMatch(view.text(), /Alice Recette|99 utilisateurs|Page 1 \/ 5/);
    assert.match(view.text(), /1 utilisateur · 20 maximum par page/);
  });
});

test('an earlier refusal cannot clear the latest loading indicator; a fresh retry succeeds', async () => {
  let earlier, latest;
  let bobReads = 0;
  await withConsole(deferred => {
    earlier = deferred(); latest = deferred();
    return request => {
      const search = request.url.searchParams.get('search');
      if (search === 'Alice') return earlier.promise;
      if (search === 'Bob') return ++bobReads === 1 ? latest.promise : response([bob]);
      return response([alice, bob]);
    };
  }, async ({ view, bff, search, completed }) => {
    await search('Alice');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await search('Bob');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 3);
    // Error DTOs are not published by BFF User; use the existing explicit
    // out-of-contract transport-refusal fixture, never claim schema coverage.
    earlier.resolve(bffError(503, 'Earlier search refused'));
    await view.waitFor(() => completed.some(item => item.search === 'Alice'));
    assert.match(view.html, /aria-label="Chargement"/);
    assert.ok(!view.text().includes(unavailable));
    latest.resolve(bffError(503, 'Latest search refused'));
    await view.waitFor(() => view.text().includes(unavailable));
    await search('Bob');
    await view.waitFor(() => completed.filter(item => item.search === 'Bob').length === 2 && view.text().includes('Bob Recette'));
    assert.ok(!view.text().includes(unavailable));
    assert.doesNotMatch(view.text(), /Alice Recette/);
  });
});

test('an earlier success cannot clear or replace a newer search refusal', async () => {
  let earlier;
  await withConsole(deferred => {
    earlier = deferred();
    return request => {
      const search = request.url.searchParams.get('search');
      return search === 'Alice' ? earlier.promise : search === 'Bob'
        ? bffError(503, 'Latest search refused') : response([alice, bob]);
    };
  }, async ({ view, bff, search, completed }) => {
    await search('Alice');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await search('Bob');
    await view.waitFor(() => view.text().includes(unavailable));
    earlier.resolve(response([alice], { total: 99 }));
    await view.waitFor(() => completed.some(item => item.search === 'Alice'));
    assert.ok(view.text().includes(unavailable));
    assert.doesNotMatch(view.text(), /99 utilisateurs/);
  });
});

test('repeated refresh of unchanged criteria keeps only the latest response', async () => {
  let earlier;
  let reads = 0;
  await withConsole(deferred => {
    earlier = deferred();
    return () => ++reads === 2 ? earlier.promise : response([bob]);
  }, async ({ view, bff, search, completed }) => {
    await search('');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await search('');
    await view.waitFor(() => completed.length === 2 && view.text().includes('Bob Recette'));
    earlier.resolve(response([alice]));
    await view.waitFor(() => completed.length === 3);
    assert.match(view.text(), /Bob Recette/);
    assert.doesNotMatch(view.text(), /Alice Recette/);
    assert.ok(bff.requests.every(request => request.method === 'GET'));
  });
});

test('a page response started before a new search cannot restore its rows or pagination', async () => {
  let earlier;
  await withConsole(deferred => {
    earlier = deferred();
    return request => request.url.searchParams.get('page') === '2' ? earlier.promise
      : request.url.searchParams.get('search') === 'Bob' ? response([bob])
        : response([alice, bob], { total: 21, total_pages: 2 });
  }, async ({ view, bff, search, completed }) => {
    await view.fire(props => props['aria-label'] === 'Page suivante', 'onClick');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await search('Bob');
    await view.waitFor(() => view.text().includes('Bob Recette') && view.text().includes('Page 1 / 1'));
    earlier.resolve(response([alice], { page: 2, total: 21, total_pages: 2 }));
    await view.waitFor(() => completed.some(item => item.page === 2));
    assert.match(view.text(), /Bob Recette/);
    assert.doesNotMatch(view.text(), /Alice Recette|Page 2 \/ 2|21 utilisateurs/);
  });
});

test('an old panel read cannot change the total after leaving and reopening Users', async () => {
  let earlier;
  let reads = 0;
  await withConsole(deferred => {
    earlier = deferred();
    return () => ++reads === 2 ? earlier.promise : response([bob]);
  }, async ({ view, bff, search, completed }) => {
    await search('');
    await view.waitFor(() => bff.calls('/bff/admin/users').length === 2);
    await view.click('Rôles');
    assert.equal(view.find('UsersPanel').length, 0);
    await view.click('Utilisateurs');
    await view.waitFor(() => completed.length === 2 && view.text().includes('Bob Recette'));
    earlier.resolve(response([alice], { total: 99 }));
    await view.waitFor(() => completed.length === 3);
    assert.match(view.text(), /Bob Recette/);
    assert.doesNotMatch(view.text(), /Alice Recette|99/);
  });
});
