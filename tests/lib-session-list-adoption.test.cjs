const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

// MAIR-607: Administrator and Settings display sessions through the one shared
// SessionList of the library; no local table or state helper remains.
test('MAIR-607 the sessions panel renders the library SessionList, not a local table', () => {
  const panel = read('src/components/administration/sessions-panel.tsx');
  assert.match(panel, /import \{ SessionList \} from "@mairie360\/lib-components\/primitives"/);
  assert.match(panel, /<SessionList\b/);
  assert.doesNotMatch(panel, /<table|function SessionTable|administration-session-state/);
  assert.equal(fs.existsSync(path.join(root, 'src/lib/administration-session-state.ts')), false, 'the local session state helper must not exist');
  const primitives = require('@mairie360/lib-components/primitives');
  for (const name of ['SessionList', 'sessionState', 'nextSessionExpiryDelay']) assert.equal(typeof primitives[name], 'function', `primitives entry exports ${name}`);
});
