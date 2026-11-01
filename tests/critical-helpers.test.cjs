const assert = require('node:assert/strict');
const { test, afterEach } = require('node:test');
const { NextRequest } = require('next/server');
const { loadTs } = require('./support/front-harness.cjs');
const [{ settingsProfileUrl }, { userBffRequest }] = loadTs(['src/lib/settings-profile.ts','src/lib/user-bff-proxy.ts']);
const realFetch = global.fetch;
const keys = ['BFF_ADMIN_BASE_URL','USER_BFF_URL','BFF_USER_API_URL','NEXT_PUBLIC_BFF_ADMIN_BASE_URL'];
const saved = Object.fromEntries(keys.map(key => [key, process.env[key]]));
afterEach(() => { global.fetch=realFetch; for (const [key,value] of Object.entries(saved)) value===undefined?delete process.env[key]:process.env[key]=value; });

test('profile destinations reject recursive and encoded profile paths without losing valid account links', () => {
  for (const value of [undefined,'','relative/path','javascript:alert(1)','https://user:secret@settings.example.test/','https://settings.example.test/profile','https://settings.example.test/PROFILE/preferences','https://settings.example.test/%70rofile','https://settings.example.test/%E0%A4%A']) assert.equal(settingsProfileUrl(value),undefined,value);
  assert.equal(settingsProfileUrl(' https://settings.example.test/account?tab=identity '),'https://settings.example.test/account?tab=identity');
  assert.equal(settingsProfileUrl('https://settings.example.test/profiles'),'https://settings.example.test/profiles');
});
test('the user adapter forwards through the configured published BFF with the frontend cookie session', async () => {
  for(const key of keys) delete process.env[key];
  process.env.BFF_USER_API_URL='https://user.example.test/';
  let received;
  global.fetch=async(url,init)=>{received={url:String(url),init};return Response.json({user:{id:42,first_name:'Agent'}});};
  const response=await userBffRequest(new NextRequest('https://admin.example.test/api/auth/me?scope=profile',{headers:{cookie:'accessToken=fixture-session; unrelated=value',Authorization:'Bearer untrusted-browser'}}),'/me');
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{user:{id:42,first_name:'Agent'}});
  assert.equal(received.url,'https://user.example.test/me?scope=profile');
  assert.equal(received.init.headers.get('Authorization'),'Bearer fixture-session');assert.equal(received.init.headers.get('cookie'),null);
  assert.equal(response.headers.get('cache-control'),'no-store');
});
