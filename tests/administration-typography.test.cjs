const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const css = readFileSync(path.join(__dirname, '../src/app/globals.css'), 'utf8');

test('administration keeps the reference root and system font independently of stylesheet order', () => {
  assert.match(css, /html\s*\{\s*font-size:\s*17px;/);
  assert.match(css, /html body\s*\{[^}]*font-family:\s*system-ui,\s*sans-serif;/);
  assert.match(css, /--font-sans:\s*system-ui,\s*sans-serif;/);
  assert.doesNotMatch(css, /font-family:\s*Arial/);
});

test('reference scale does not replace standard small-text tokens or force header height', () => {
  assert.doesNotMatch(css, /--text-(?:xs|sm)\s*:/);
  assert.doesNotMatch(css, /(?:header|\.text-(?:xs|sm))\s*\{/);
  assert.doesNotMatch(css, /!important/);
});
