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

test('dismissing a confirmed role receipt preserves its failed read recovery and never repeats the role write', async t => {
  let writes = 0;
  let reads = 0;
  t.mock.method(administrationApi, 'createRole', async () => { writes += 1; });
  t.mock.method(administrationApi, 'listRoles', async () => { reads += 1; throw new Error('Lecture indisponible'); });
  const view = mount(React.createElement(AdministrationConsole, {
    initialSearch: 'tab=roles',
    initialState: { users: null, usersError: null, roles: [], groups: [], activeSessions: [], sessionHistory: [], error: null, authRequired: false },
  }));
  t.after(() => { view.unmount(); delete global.window; delete global.document; });
  await view.settle();
  await view.fire(props => props.id === 'role-name', 'onChange', { target: { value: 'Rôle demandé' } });
  await view.fire(props => props.id === 'role-description', 'onChange', { target: { value: 'Description conservée' } });
  await view.fire(props => props.id === 'role-form', 'onSubmit');
  assert.equal(writes, 1);
  assert.equal(reads, 1);
  assert.match(view.text(), /Rôle créé/);
  assert.match(view.text(), /Ne répétez pas l’action/);
  const dom = new JSDOM(view.html);
  try {
    const notices = [...dom.window.document.querySelectorAll('[role="status"]')]
      .filter(node => node.textContent.includes('Rôle créé.'));
    assert.equal(notices.length, 1);
    assert.ok(notices[0].querySelector('button[aria-label]'),
      'The confirmed action exposes a separate notification close command.');
  } finally { dom.window.close(); }
  const notice = view.hostElements(props => props.role === 'status' && typeof props.onKeyDown === 'function')[0];
  await view.act(() => notice?.props.onKeyDown({ key: 'Escape', preventDefault() {}, stopPropagation() {} }));
  assert.doesNotMatch(view.text(), /Rôle créé/);
  assert.match(view.text(), /Ne répétez pas l’action/);
  assert.equal(view.hostElements((_props, text) => text === 'Réessayer l’actualisation').length, 1);
  assert.equal(writes, 1);
  assert.equal(reads, 1);
});

test('a confirmed empty roles collection has a named section while its create form remains usable', () => {
  const { renderToStaticMarkup } = require('react-dom/server');
  const dom = new JSDOM(renderToStaticMarkup(React.createElement(RolesPanel, {
    roles: [], loading: false, busyAction: null, runAction: async () => false,
    refreshRoles: async () => {}, onRoleDeleted() {},
  })));
  try {
    const document = dom.window.document;
    assert.ok([...document.querySelectorAll('section[aria-labelledby]')]
      .some(node => document.getElementById(node.getAttribute('aria-labelledby'))?.textContent === 'Aucun rôle disponible.'),
    'The confirmed empty collection exposes its own accessible name.');
    assert.ok(document.querySelector('#role-name'), 'The role creation field is retained.');
    assert.doesNotMatch(document.body.textContent, /Chargement des rôles|n’ont pas pu être chargés/);
  } finally { dom.window.close(); }
});
