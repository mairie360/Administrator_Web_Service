const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { loadTs } = require('./support/front-harness.cjs');

// MAIR-608: every level of the administration tree, rendered on its own (no BFF).
// MAIR-608 component tree: each level is loaded from its own folder index.
const ui = Object.assign({}, ...loadTs(['src/components/AdministrationPage/components/AccessDenied/index.ts', 'src/components/AdministrationPage/components/ActionButton/index.ts', 'src/components/AdministrationPage/components/Field/index.ts', 'src/components/AdministrationPage/components/Panel/index.ts', 'src/components/AdministrationPage/components/ProfileChecking/index.ts', 'src/components/AdministrationPage/components/ProfileUnavailable/index.ts', 'src/components/AdministrationPage/controls.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/ConsoleHeader/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/ConsoleMetrics/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/ConsoleNotices/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/ConsoleTabs/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/components/GroupsList/components/GroupCard/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/components/GroupEditForm/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/components/GroupMembers/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/components/GroupMemberSearch/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/components/GroupsList/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/RoleChangeWarning/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/components/RoleForm/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/components/RolesList/components/RoleRow/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/components/RolesList/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/SessionsPanel/components/SessionsViewSwitch/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UserCreateForm/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UserEditForm/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UserPasswordReset/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UsersPagination/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UsersSearch/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/components/UsersTable/index.ts']));
const h = React.createElement;
let view;
beforeEach(() => { global.window = { location: { origin: 'https://admin.test', href: 'https://admin.test/', pathname: '/', search: '' } }; });
afterEach(() => { view?.unmount(); view = undefined; delete global.window; delete global.document; });
const render = (element) => { view = mount(element); return view; };
const role = { id: 9, name: 'Agent', description: 'Agents de la mairie', can_be_deleted: true };
const user = (id, extra = {}) => ({ id, first_name: 'Alice', last_name: 'Dupont', email: `user${id}@mairie.test`, phone_number: null, roles: [{ id: 9, name: 'Agent' }], status: 'Actif', is_archived: false, ...extra });
const group = { id: 3, name: 'Voirie', description: '', owner_id: 7 };

test('ActionButton maps each administration variant onto a lib button and shows busy as loading', () => {
  render(h(React.Fragment, null,
    h(ui.ActionButton, { variant: 'primary' }, 'Primaire'), h(ui.ActionButton, { variant: 'secondary' }, 'Secondaire'),
    h(ui.ActionButton, { variant: 'danger' }, 'Danger'), h(ui.ActionButton, { variant: 'dangerSolid' }, 'Plein'), h(ui.ActionButton, { variant: 'ghost', busy: true }, 'Discret')));
  for (const [label, variant, tone] of [['Primaire', 'solid', 'primary'], ['Secondaire', 'outline', 'neutral'], ['Danger', 'outline', 'danger'], ['Plein', 'solid', 'danger'], ['Discret', 'ghost', 'neutral']]) {
    const button = view.hostElements(label).find(({ type }) => type === 'button');
    assert.equal(button.props['data-variant'], variant, label); assert.equal(button.props['data-tone'], tone, label);
  }
  const busy = view.hostElements('Discret').find(({ type }) => type === 'button');
  assert.equal(busy.props.disabled, true); assert.equal(busy.props['aria-busy'], true);
});

test('Panel and Field render the lib typography around their content', () => {
  render(h(ui.Panel, { title: 'Rôles', description: 'Liste', action: h('button', { type: 'button' }, 'Action') }, h(ui.Field, { label: 'Nom', htmlFor: 'n', hint: 'Aide' }, h('input', { id: 'n' }))));
  assert.match(view.html, /<h2[^>]*>Rôles<\/h2>/); assert.match(view.html, /Liste/); assert.match(view.html, /<label for="n"/); assert.match(view.html, /Aide/);
  assert.equal(ui.formatDate(null), '—'); assert.equal(ui.formatDate('pas une date'), 'pas une date');
});

test('roles: row actions, list states and the three write modes of the form', async () => {
  const edits = []; const deletes = [];
  render(h(ui.RoleRow, { role, deleting: false, onEdit: (r) => edits.push(r.id), onDelete: (r) => deletes.push(r.id) }));
  assert.match(view.text(), /Agent/); assert.match(view.text(), /#9/); assert.match(view.text(), /Agents de la mairie/);
  await view.click('Modifier'); await view.click('Supprimer');
  assert.deepEqual([edits, deletes], [[9], [9]]);
  view.unmount();
  for (const [props, expected] of [[{ roles: null, loading: true }, /Chargement des rôles/], [{ roles: null, loading: false }, /n’ont pas pu être chargés/], [{ roles: [], loading: false }, /Aucun rôle disponible/]]) {
    render(h(ui.RolesList, { ...props, busyAction: null, onEdit() {}, onDelete() {} }));
    assert.match(view.text(), expected); view.unmount();
  }
  assert.equal(ui.roleFormTitle('create'), 'Créer un rôle'); assert.match(ui.roleFormDescription('update'), /Mettez à jour/);
  const changes = [];
  render(h(ui.RoleForm, { mode: 'replace', form: { name: 'A', description: 'B', can_be_deleted: true }, saving: false, onModeChange: (m) => changes.push(m), onChange() {}, onCancel() {}, onSubmit() {} }));
  assert.match(view.html, /Remplacement complet \(PUT\)/); assert.match(view.text(), /Enregistrer/); assert.match(view.text(), /Annuler/);
  await view.fire(props => props.id === 'role-write-mode', 'onChange', { target: { value: 'update' } });
  assert.deepEqual(changes, ['update']);
});

test('groups: card selection, list states, create / edit forms, members and candidates', async () => {
  const opened = [];
  render(h(ui.GroupCard, { group, selected: true, onOpen: (id) => opened.push(id) }));
  assert.match(view.text(), /Aucune description/); assert.match(view.html, /aria-pressed="true"/);
  await view.click((_p, text, tag) => tag === 'button' && text.includes('Ouvrir le groupe'));
  assert.deepEqual(opened, [3]); view.unmount();
  render(h(ui.GroupsList, { groups: [], loading: false, selectedId: null, onOpen() {} })); assert.match(view.text(), /Aucun groupe/); view.unmount();
  render(h(ui.GroupEditForm, { form: { name: 'Voirie', description: '' }, ownerLabel: 'Alice Dupont', saving: false, onChange() {}, onSubmit() {} }));
  assert.match(view.text(), /Propriétaire : Alice Dupont/); assert.match(view.html, /id="edit-group-name"[^>]*value="Voirie"/); view.unmount();
  const removed = [];
  render(h(ui.GroupMembers, { members: [user(7)], busyAction: null, onRefresh() {}, onRemove: (m) => removed.push(m.id) }));
  assert.match(view.text(), /Membres \(1\)/); assert.match(view.text(), /user7@mairie\.test/);
  await view.click('Retirer'); assert.deepEqual(removed, [7]); view.unmount();
  render(h(ui.GroupMembers, { members: [], busyAction: null, onRefresh() {}, onRemove() {} })); assert.match(view.text(), /ne contient aucun utilisateur/); view.unmount();
  const added = []; const searches = [];
  render(h(ui.GroupMemberSearch, { search: '', onSearch: (v) => searches.push(v), candidates: [user(8, { first_name: 'Bob' })], loading: false, error: null, busyAction: null, onAdd: (u) => added.push(u.id) }));
  await view.click('Ajouter'); assert.deepEqual(added, [8]);
  await view.fire(props => props.id === 'group-user-search', 'onChange', { target: { value: 'Bob' } }); assert.deepEqual(searches, ['Bob']); view.unmount();
  render(h(ui.GroupMemberSearch, { search: 'x', onSearch() {}, candidates: [], loading: false, error: 'Lecture refusée', busyAction: null, onAdd() {} }));
  assert.match(view.text(), /Lecture refusée/);
});

test('users: search, table rows, pagination honesty and the three forms', async () => {
  const typed = [];
  render(h(ui.UsersSearch, { value: 'Bob', onType: (v) => typed.push(v), onSubmit() {} }));
  assert.match(view.html, /type="search"[^>]*value="Bob"/); await view.fire(props => props.type === 'search', 'onChange', { target: { value: 'Bo' } }); assert.deepEqual(typed, ['Bo']); view.unmount();
  const selected = [];
  render(h(ui.UsersTable, { users: [user(7), user(8, { is_archived: true, roles: [] })], selectedId: 7, locked: false, onSelect: (u) => selected.push(u.id) }));
  assert.match(view.html, /<th[^>]*>Utilisateur<\/th><th[^>]*>Contact<\/th><th[^>]*>Rôle<\/th><th[^>]*>Statut<\/th>/);
  assert.match(view.text(), /Archivé/); assert.match(view.text(), /Aucun rôle/); assert.match(view.text(), /Aucun téléphone/);
  await view.fire((props, text, tag) => tag === 'tr' && text.includes('Identifiant #8'), 'onKeyDown', { key: 'Enter' });
  assert.deepEqual(selected, [8]); view.unmount();
  const page = { users: [], page: 2, page_size: 20, total: 25, total_pages: 2 }; const moves = [];
  render(h(ui.UsersPagination, { usersPage: page, page: 2, loading: false, received: true, mutationConfirmed: false, onChange: (d) => moves.push(d) }));
  assert.match(view.text(), /25 utilisateurs · 20 maximum par page/); assert.match(view.text(), /Page 2 \/ 2/);
  await view.click(props => props['aria-label'] === 'Page précédente'); assert.deepEqual(moves, [-1]);
  assert.equal(view.hostElements(props => props['aria-label'] === 'Page suivante')[0].props.disabled, true); view.unmount();
  render(h(ui.UsersPagination, { usersPage: page, page: 2, loading: false, received: true, mutationConfirmed: true, onChange() {} }));
  assert.match(view.text(), /Total à actualiser/); assert.match(view.text(), /pagination à actualiser/); view.unmount();
  render(h(ui.UserCreateForm, { form: ui.emptyUserCreateDraft, saving: false, onChange() {}, onCancel() {}, onSubmit() {} }));
  for (const id of ['create-first-name', 'create-last-name', 'create-email', 'create-phone', 'create-password']) assert.match(view.html, new RegExp(`id="${id}"`));
  view.unmount();
  render(h(ui.UserEditForm, { form: { first_name: 'A', last_name: 'B', email: 'a@b', phone_number: '', roleId: '9' }, roles: [role], saving: false, deleting: false, onChange() {}, onDelete() {}, onSubmit() {} }));
  assert.match(view.html, /<option value="9"[^>]*>Agent<\/option>/); assert.match(view.text(), /Supprimer l’utilisateur/); view.unmount();
  render(h(ui.UserPasswordReset, { form: { password: 'abcdefgh', confirmation: 'abcdefgX' }, busy: false, onChange() {}, onSubmit() {} }));
  assert.match(view.html, /role="alert"[^>]*>Les deux mots de passe ne correspondent pas\./);
  assert.equal(view.hostElements('Réinitialiser le mot de passe').find(({ type }) => type === 'button').props.disabled, true); view.unmount();
  render(h(ui.RoleChangeWarning, { messages: ['Le profil est enregistré.', 'Ajout du rôle « Agent » non confirmé.'] }));
  assert.match(view.html, /role="alert"/); assert.match(view.text(), /non confirmé/);
});

test('sessions switch, console header / notices / counters / tabs and the page states', async () => {
  const views = [];
  render(h(ui.SessionsViewSwitch, { view: 'active', onChange: (v) => views.push(v), activeCount: 2, historyCount: undefined }));
  assert.match(view.text(), /Actives \(2\)/); assert.match(view.text(), /Historique \(—\)/);
  await view.click((props) => props.role === 'radio' && props['aria-checked'] === false); assert.deepEqual(views, ['history']); view.unmount();
  render(h(ui.ConsoleHeader, { loading: false, locked: true, onRefresh() {} }));
  assert.match(view.html, /<h1[^>]*>Administration<\/h1>/); assert.equal(view.hostElements('Actualiser').find(({ type }) => type === 'button').props.disabled, true); view.unmount();
  const retried = [];
  render(h(ui.ConsoleNotices, { authRequired: false, loadError: 'BFF injoignable', notice: 'Rôle créé.', actionError: null, refreshFailure: { message: 'Lecture refusée.', retry: async () => {} }, busyAction: null, onCloseNotice() {}, onCloseError() {}, onRetryRefresh: () => retried.push(1) }));
  assert.match(view.text(), /Certaines données n’ont pas pu être chargées/); assert.match(view.text(), /Ne répétez pas l’action/); assert.match(view.text(), /Rôle créé\./);
  await view.click('Réessayer l’actualisation'); assert.deepEqual(retried, [1]); view.unmount();
  render(h(ui.ConsoleNotices, { authRequired: true, loadError: 'x', notice: null, actionError: null, refreshFailure: null, busyAction: null, onCloseNotice() {}, onCloseError() {}, onRetryRefresh() {} }));
  assert.match(view.text(), /Session administrateur requise/); assert.doesNotMatch(view.text(), /Certaines données/); view.unmount();
  const metrics = ui.consoleMetrics({ users: null, roles: 2, groups: undefined, sessions: 0 });
  assert.deepEqual(metrics.map((m) => m.value), ['—', 2, '—', 0]);
  const tabs = [];
  render(h(ui.ConsoleMetrics, { metrics, activeTab: 'roles', locked: false, onOpen: (t) => tabs.push(t) }));
  await view.click((_p, text, tag) => tag === 'button' && text.includes('Groupes')); assert.deepEqual(tabs, ['groups']); view.unmount();
  render(h(ui.ConsoleTabs, { value: 'users', locked: false, onChange() {} }));
  assert.match(view.html, /aria-label="Sections d’administration"/); assert.match(view.html, /id="administration-tab-users"[^>]*aria-selected="true"/);
  assert.deepEqual(ui.administrationTabs.map((t) => t.id), ['users', 'roles', 'groups', 'sessions']); view.unmount();
  render(h(ui.AccessDenied)); assert.match(view.text(), /Accès réservé aux administrateurs/); view.unmount();
  const retries = [];
  render(h(ui.ProfileUnavailable, { error: 'Profil illisible', onRetry: () => retries.push(1) }));
  assert.match(view.html, /role="alert"/); await view.click('Réessayer'); assert.deepEqual(retries, [1]); view.unmount();
  render(h(ui.ProfileChecking)); assert.match(view.text(), /Vérification du profil/);
});
