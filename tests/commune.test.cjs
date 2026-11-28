const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');
const { administrationDom } = require('./support/administration-dom.cjs');

const [{ communeName }] = loadTs(['src/lib/commune.ts']);

test('MAIR-1109 the configured commune name is kept without its « Mairie de » prefix', () => {
  assert.equal(communeName('Saint-Pierre'), 'Saint-Pierre');
  assert.equal(communeName('  Mairie de Saint-Pierre '), 'Saint-Pierre');
  assert.equal(communeName('Commune de La Possession'), 'La Possession');
  assert.equal(communeName("Mairie d'Étang-Salé"), 'Étang-Salé');
  for (const value of [undefined, '', '   ', 'Mairie de ', 'x'.repeat(81)]) assert.equal(communeName(value), undefined);
  assert.equal(communeName('Saint\u0000-Leu'), 'Saint-Leu');
});

for (const configured of [true, false]) test(`MAIR-1109 the header ${configured ? 'shows the configured commune' : 'hides the commune block when none is configured'}`, async t => {
  const previous = process.env.COMMUNE_NAME;
  if (configured) process.env.COMMUNE_NAME = 'Mairie de Saint-Pierre'; else delete process.env.COMMUNE_NAME;
  t.after(() => { if (previous === undefined) delete process.env.COMMUNE_NAME; else process.env.COMMUNE_NAME = previous; });
  const dom = await administrationDom(t, { serverPage: true, expected: 'Aucun utilisateur' });
  const header = dom.document.querySelector('header')?.textContent ?? '';
  assert.doesNotMatch(dom.document.body.textContent, /Saint-André/, 'The sample name of the library is never shown.');
  if (configured) assert.match(header, /Saint-Pierre/); else assert.doesNotMatch(header, /Mairie de/);
});

test('ZAP 10024: the URL keys V2 adds carry no name ZAP reads as sensitive (user, pass, session, token)', () => {
  const [{ administrationUrlSchema, usersUrlSchema, administrationSearch }] = loadTs(['src/lib/administration-query.ts']);
  // usersSearch and usersPage predate V2 and the scan's baseline; any other key must stay neutral.
  const keys = Object.keys({ ...administrationUrlSchema, ...usersUrlSchema }).filter(key => !['usersSearch', 'usersPage'].includes(key));
  assert.deepEqual(keys.sort(), ['role', 'sort', 'status', 'tab']);
  for (const key of keys) assert.doesNotMatch(key, /user|pass|session|token/i, key);
  assert.equal(administrationSearch({ tab: 'users', status: 'suspended', role: '4', sort: '-name', usersStatus: 'active' }), 'tab=users&status=suspended&role=4&sort=-name');
  // The « Services » and « Sécurité » tabs left the console; their URL keys are dropped.
  assert.equal(administrationSearch({ tab: 'security', journal: '42' }), '');
  assert.equal(administrationSearch({ tab: 'services' }), '');
});
