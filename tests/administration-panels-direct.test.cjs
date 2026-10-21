const assert = require('node:assert/strict');
const { before, after, beforeEach, afterEach, test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { loadTs, FrontHarness, FRONT_ORIGIN } = require('./support/front-harness.cjs');
const { bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const [{ RolesPanel }, { SessionsPanel }, { GroupsPanel }, { UsersPanel }] = loadTs([
  'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/SessionsPanel/index.ts',
  'src/components/AdministrationPage/components/AdministrationConsole/components/GroupsPanel/index.ts', 'src/components/AdministrationPage/components/AdministrationConsole/components/UsersPanel/index.ts',
]);
const bff = new ContractMockServer('BFF_USER', bffUserContract());
let front, view;
before(async () => { await bff.start(); front = new FrontHarness({ bff }).install(); });
after(async () => { front.uninstall(); await bff.stop(); });
beforeEach(() => { global.window = { location:{ origin:FRONT_ORIGIN, href:FRONT_ORIGIN+'/',pathname:'/',search:'' } }; });
afterEach(() => { view?.unmount(); view=undefined; delete global.window; delete global.document; assert.deepEqual([...bff.violations,...front.violations],[]); bff.reset();front.reset(); });
const role = { id:9,name:'Council agent',description:'Initial description',can_be_deleted:true };
const field = id => view.hostElements(props => props.id === id)[0].props;
const change = (id,value) => view.act(() => field(id).onChange({ target:{ value } }));
const runAction = async (_id,_message,operation,refresh) => { await operation(); await refresh?.(); return true; };

for (const mode of ['replace','update']) test(`the roles panel submits a trimmed ${mode} draft and resets only after the write`, async () => {
  global.document = { getElementById:() => ({ scrollIntoView(){} }) };
  const method=mode==='replace'?'put':'patch';
  bff.on(method,'/admin/roles/{roleId}',{status:204});
  let refreshes=0;
  view=mount(React.createElement(RolesPanel,{roles:[role],loading:false,busyAction:null,runAction,refreshRoles:async()=>{refreshes++;},onRoleDeleted:()=>assert.fail('no deletion')}));
  await view.click('Modifier');
  if(mode==='update') await change('role-write-mode','update');
  await change('role-name','  Updated role  '); await change('role-description','  Updated description  ');
  await view.fire(props=>props.type==='checkbox','onChange',{target:{checked:false}});
  await view.fire(props=>props.id==='role-form','onSubmit');
  const [request]=bff.calls('/admin/roles/{roleId}',method.toUpperCase());
  assert.deepEqual(request.body,{name:'Updated role',description:'Updated description',can_be_deleted:false});
  assert.equal(refreshes,1);assert.equal(field('role-name').value,'');assert.match(view.text(),/Créer un rôle/);
});
test('the roles panel cancels edits without sending the draft',async()=>{
  global.document={getElementById:()=>({scrollIntoView(){}})};
  view=mount(React.createElement(RolesPanel,{roles:[role],loading:false,busyAction:null,runAction,refreshRoles:async()=>{},onRoleDeleted:()=>{}}));
  await view.click('Modifier');await change('role-name','Unsent draft');await view.click('Annuler');
  assert.equal(field('role-name').value,'');assert.equal(bff.requests.length,0);
});
test('the groups panel submits its own create form and clears only a confirmed draft',async()=>{
  const group={id:3,name:'Created group',description:'Group description',owner_id:1};
  bff.on('post','/admin/groups',{status:201,body:{group}});
  view=mount(React.createElement(GroupsPanel,{groups:[],loading:false,busyAction:null,runAction,refreshGroups:async()=>{},onGroupDeleted:()=>{}}));
  await change('group-name','  Created group  ');await change('group-description','  Group description  ');
  await view.fire((_props,_text,tag)=>tag==='form','onSubmit');
  assert.deepEqual(bff.calls('/admin/groups','POST')[0].body,{name:'Created group',description:'Group description'});
  assert.equal(field('group-name').value,'');assert.equal(field('group-description').value,'');
});
test('the sessions panel switches displayed records without mutating the server',async()=>{
  const session=(id)=>({id,device_info:id,ip_address:'192.0.2.1',created_at:'2026-10-01T00:00:00Z',expires_at:'2026-10-02T00:00:00Z',revoked_at:null});
  view=mount(React.createElement(SessionsPanel,{activeSessions:[session('active-device')],sessionHistory:[session('history-device')],loading:false,busyAction:null,runAction,refreshSessions:async()=>{}}));
  assert.match(view.text(),/active-device/);assert.doesNotMatch(view.text(),/history-device/);
  await view.click('Historique (1)');assert.match(view.text(),/history-device/);assert.doesNotMatch(view.text(),/active-device/);
  await view.click('Actives (1)');assert.match(view.text(),/active-device/);assert.equal(bff.requests.length,0);
});
test('the users panel cancels an unsent user editor while retaining the fetched list',async()=>{
  bff.on('get','/admin/users',{body:{users:[],page:1,page_size:20,total:0,total_pages:0}});
  view=mount(React.createElement(UsersPanel,{roles:[],busyAction:null,runAction,onTotalChange:()=>{}}));
  await view.waitFor(html=>html.includes('Aucun utilisateur disponible.'));
  await view.click('Nouvel utilisateur');
  await change('create-first-name','Unsent');await change('create-email','unsent@example.test');
  await view.click('Annuler');
  assert.equal(view.hostElements(props=>props.id==='create-email').length,0);
  assert.equal(bff.requests.length,1);assert.equal(bff.requests[0].method,'GET');
});
