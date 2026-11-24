const assert = require('node:assert/strict');
const { before, after, beforeEach, afterEach, test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');
const { loadTs, FrontHarness, FRONT_ORIGIN } = require('./support/front-harness.cjs');
const { bffUserContract } = require('./support/bff-user-contract.cjs');
const { ContractMockServer } = require('./support/contract-mock-server.cjs');
const [{ RolesPanel }, { GroupsPanel }, { UsersPanel }] = loadTs([
  'src/components/AdministrationPage/components/AdministrationConsole/components/RolesPanel/index.ts',
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

test('MAIR-916 the role modal creates a trimmed role and closes after the write', async () => {
  bff.on('post','/admin/roles',{status:201,body:{role:{...role,id:10,name:'Created role'}}});
  let refreshes=0;
  view=mount(React.createElement(RolesPanel,{roles:[role],loading:false,busyAction:null,runAction,refreshRoles:async()=>{refreshes++;},onRoleDeleted:()=>assert.fail('no deletion')}));
  await view.click('Nouveau rôle');
  await change('role-name','  Created role  '); await change('role-description','  New description  ');
  await view.fire((_props,_text,tag)=>tag==='form','onSubmit',{preventDefault(){}});
  await view.waitFor(()=>refreshes===1);
  assert.deepEqual(bff.calls('/admin/roles','POST')[0].body,{name:'Created role',description:'New description',can_be_deleted:true,modules:['dashboard']});
  assert.equal(refreshes,1);assert.equal(view.hostElements(props=>props.id==='role-name').length,0);
});
test('MAIR-916 the role modal refuses a name already taken without sending it',async()=>{
  view=mount(React.createElement(RolesPanel,{roles:[role],loading:false,busyAction:null,runAction,refreshRoles:async()=>{},onRoleDeleted:()=>{}}));
  await view.click('Nouveau rôle');await change('role-name','council agent');
  await view.fire((_props,_text,tag)=>tag==='form','onSubmit',{preventDefault(){}});
  assert.equal(bff.requests.length,0);assert.ok(view.hostElements(props=>props.id==='role-name').length>0);
  await view.click('Annuler');assert.equal(view.hostElements(props=>props.id==='role-name').length,0);
});
test('the groups panel submits its create modal and clears only a confirmed draft',async()=>{
  const group={id:3,name:'Created group',description:'Group description',owner_id:1};
  bff.on('post','/admin/groups',{status:201,body:{group}});
  bff.on('get','/admin/projects-without-group',{body:{total:0,projects:[]}});
  view=mount(React.createElement(GroupsPanel,{groups:[],loading:false,busyAction:null,runAction,refreshGroups:async()=>{},onGroupDeleted:()=>{}}));
  await view.click('Nouveau groupe');
  await change('group-name','  Created group  ');await change('group-description','  Group description  ');
  await view.fire((_props,_text,tag)=>tag==='form','onSubmit',{preventDefault(){}});
  await view.waitFor(()=>bff.calls('/admin/groups','POST').length===1);
  assert.deepEqual(bff.calls('/admin/groups','POST')[0].body,{name:'Created group',description:'Group description',color:null});
  assert.equal(view.hostElements(props=>props.id==='group-name').length,0);
});
test('MAIR-857 the users panel cancels an unsent user modal while retaining the fetched list',async()=>{
  bff.on('get','/admin/users',{body:{users:[],page:1,page_size:6,total:0,total_pages:0}});
  bff.on('get','/admin/services',{body:{services:[]}});
  view=mount(React.createElement(UsersPanel,{roles:[],busyAction:null,runAction,onTotalChange:()=>{},currentUserId:1}));
  await view.waitFor(html=>html.includes('Aucun utilisateur'));
  await view.click('Nouvel utilisateur');
  await change('create-first-name','Unsent');await change('create-email','unsent@example.test');
  await view.click('Annuler');
  assert.equal(view.hostElements(props=>props.id==='create-email').length,0);
  // Only reads: the list, and the services offered by the form (MAIR-923); nothing was written.
  assert.deepEqual(bff.requests.map(({method,template})=>`${method} ${template}`).sort(),['GET /admin/services','GET /admin/users']);
});
