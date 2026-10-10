const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');
const [auth, urls] = loadTs(['src/lib/logout.ts', 'src/lib/front-urls.ts']);
const { logoutAndReload, navigateToLogin, isSessionRecoveryPending } = auth;
const { setBrowserFrontUrls } = urls;
const originalFetch = global.fetch;
let requests, destinations;
beforeEach(() => {
  requests = []; destinations = [];
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'https://login.test.example/', ADMINISTRATION_FRONT_URL: 'https://admin.test.example/' });
  global.window = { location: { origin: 'https://admin.test.example', pathname: '/', search: '?tab=security', assign: href => destinations.push(href) } };
});
afterEach(() => { global.fetch = originalFetch; delete global.window; setBrowserFrontUrls({}); });

test('confirmed logout uses one same-origin POST before canonical Login navigation', async () => {
  global.fetch = async (...args) => { requests.push(args); return Response.json({ message: 'Session revoked', session_revoked: true }); };
  await logoutAndReload();
  assert.equal(requests.length, 1); assert.equal(requests[0][0], '/api/auth/logout');
  assert.equal(requests[0][1].method, 'POST'); assert.equal(requests[0][1].credentials, 'same-origin');
  assert.equal(requests[0][1].redirect, 'manual'); assert.equal(requests[0][1].cache, 'no-store');
  assert.deepEqual(JSON.parse(requests[0][1].body), {});
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), 'https://admin.test.example/?tab=security');
});
for (const [label, response] of [
  ['false receipt', () => Response.json({ message: 'Unconfirmed', session_revoked: false })],
  ['message-only receipt', () => Response.json({ message: 'Unconfirmed' })],
  ['service refusal', () => Response.json({ message: 'Unavailable' }, { status: 503 })],
  ['network failure', () => { throw new Error('Unavailable'); }],
]) test(`${label} retains an explicit return choice and prevents a late automatic handoff`, async () => {
  global.fetch = response;
  await assert.rejects(logoutAndReload(), /déconnexion n’a pas été confirmée/);
  assert.deepEqual(destinations, []); assert.equal(isSessionRecoveryPending(), true);
  assert.equal(navigateToLogin(), false); assert.deepEqual(destinations, []);
  assert.equal(navigateToLogin({ explicit: true }), true);
  assert.equal(new URL(destinations[0]).searchParams.get('redirect'), 'https://admin.test.example/?tab=security');
});
test('invalid Login URL prevents navigation even after a confirmed receipt', async () => {
  setBrowserFrontUrls({ LOGIN_FRONT_URL: 'javascript:alert(1)' });
  global.fetch = async () => Response.json({ message: 'Session revoked', session_revoked: true });
  await assert.rejects(logoutAndReload(), /retour à la connexion est indisponible/);
  assert.deepEqual(destinations, []); assert.equal(isSessionRecoveryPending(), true);
});

test('a late data refusal cannot navigate while an explicit logout receipt is pending', async () => {
 let reply;global.fetch=()=>new Promise(resolve=>{reply=resolve;});
 const pending=logoutAndReload();const held=isSessionRecoveryPending();const automatic=navigateToLogin();const navigationsBeforeReceipt=[...destinations];
 reply(Response.json({message:'Unconfirmed',session_revoked:false}));
 await assert.rejects(pending,/déconnexion n’a pas été confirmée/);
 assert.equal(held,true);assert.equal(automatic,false);assert.deepEqual(navigationsBeforeReceipt,[]);
});
test('a confirmed owner receipt finishes the optional HTTPS realm sign-out', async () => {
 const target='https://sso.mairie.test/realms/mairie/protocol/openid-connect/logout';
 global.fetch=async()=>Response.json({message:'Session revoked',session_revoked:true,logout_url:target});
 await logoutAndReload();assert.deepEqual(destinations,[target]);
});
for(const url of ['javascript:alert(1)','http://sso.mairie.test/realms/mairie/protocol/openid-connect/logout','https://sso.mairie.test/unrelated','https://user:password@sso.mairie.test/realms/mairie/protocol/openid-connect/logout','https://sso.mairie.test/realms/mairie/protocol/openid-connect/logout#unexpected'])test('unsafe owner sign-out destination stays in recovery '+url.split(':')[0],async()=>{
 global.fetch=async()=>Response.json({message:'Session revoked',session_revoked:true,logout_url:url});
 await assert.rejects(logoutAndReload(),/déconnexion n’a pas été confirmée/);assert.deepEqual(destinations,[]);assert.equal(isSessionRecoveryPending(),true);
});
