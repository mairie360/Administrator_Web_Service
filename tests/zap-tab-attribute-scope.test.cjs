const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');
const [{ readPageUrlState }, { administrationUrlSchema, administrationSearch }] = loadTs(['src/lib/page-url-state.ts', 'src/lib/administration-query.ts']);

// MAIR-770: ZAP 10031 (user controllable attribute) flags `?tab=sessions` because a valid tab
// id is rendered back. The exception only holds while `tab` is a closed list.
const rules = readFileSync(path.join(__dirname, '../.zap/rules.tsv'), 'utf8').trim().split('\n').map(line => line.split('\t'));
const tabs = ['users', 'roles', 'groups', 'sessions'];

test('MAIR-770: ZAP 10031 is out of scope only on the valid console tab URLs', () => {
  const entries = rules.filter(([id]) => id === '10031');
  assert.equal(entries.length, 1, 'rule 10031 must not be ignored globally');
  const [, action, pattern] = entries[0];
  assert.equal(action, 'OUTOFSCOPE');
  const scope = new RegExp(pattern);
  for (const tab of tabs) assert.ok(scope.test(`http://administrator-front:5000/?tab=${tab}`), tab);
  for (const url of [
    'http://administrator-front:5000/?tab=%22onmouseover%3Dalert(1)',
    'http://administrator-front:5000/?tab=sessions&usersSearch=%3Cscript%3E',
    'http://administrator-front:5000/?usersSearch=sessions',
    'http://administrator-front:5000/admin/users?tab=users',
  ]) assert.equal(scope.test(url), false, url);
});

test('MAIR-770: a tab outside the closed list never reaches the page', () => {
  for (const tab of tabs) assert.equal(readPageUrlState(`?tab=${tab}`, administrationUrlSchema).tab, tab);
  for (const hostile of ['"onmouseover="alert(1)', '<script>alert(1)</script>', 'Sessions', 'sessions ', '']) {
    const search = `?tab=${encodeURIComponent(hostile)}`;
    assert.equal(readPageUrlState(search, administrationUrlSchema).tab, 'users', hostile);
    assert.equal(administrationSearch({ tab: hostile }), '', hostile);
  }
});
