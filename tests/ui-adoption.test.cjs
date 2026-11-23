const assert = require('node:assert/strict');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { loadTs } = require('./support/front-harness.cjs');
const [{ AdministrationConsole }, { RolesPanel }, { administrationApi }] = loadTs([
  'src/components/AdministrationPage/components/AdministrationConsole/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/index.ts', 'src/lib/administration-api.ts',
]);

test('a confirmed role creation whose follow-up read fails is never written again; the retry only reads', async t => {
  let writes = 0;
  let reads = 0;
  t.mock.method(administrationApi, 'createRole', async () => { writes += 1; });
  t.mock.method(administrationApi, 'listRoles', async () => { reads += 1; throw new Error('Lecture indisponible'); });
  const view = mount(React.createElement(AdministrationConsole, {
    initialSearch: 'tab=roles',
    initialState: { users: null, usersError: null, roles: [], groups: [], error: null, authRequired: false },
  }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.settle();
  await view.click('Nouveau rôle');
  await view.fire(props => props.id === 'role-name', 'onChange', { target: { value: 'Rôle demandé' } });
  await view.fire((_props, _text, tag) => tag === 'form', 'onSubmit', { preventDefault() {} });
  await view.waitFor(() => reads === 1 && /Ne répétez pas l’action/.test(view.text()));
  assert.equal(writes, 1);
  await view.click('Réessayer l’actualisation');
  await view.waitFor(() => reads === 2);
  assert.equal(writes, 1);
});

test('a confirmed empty roles collection has its named empty state while the creation stays available', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(RolesPanel, {
    roles: [], loading: false, busyAction: null, runAction: async () => false,
    refreshRoles: async () => {}, onRoleDeleted() {},
  })));
  try {
    const document = dom.window.document;
    assert.match(document.body.textContent, /Aucun rôle disponible\./);
    assert.ok([...document.querySelectorAll('button')].some(button => button.textContent.includes('Nouveau rôle') && !button.disabled));
    assert.doesNotMatch(document.body.textContent, /n’ont pas pu être chargés/);
  } finally { dom.window.close(); }
});
