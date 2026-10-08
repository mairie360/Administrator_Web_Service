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

test('navigation keeps measured reference targets and shadow with mobile Close above it', () => {
  // CSS structure is a guard; native desktop/mobile recipes prove geometry and focus.
  assert.match(css, /aside\[aria-label="Navigation principale"\]\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*20;[^}]*box-shadow:\s*8px 0 24px rgb\(12 28 48 \/ 28%\);/);
  assert.match(css, /aside\[aria-label="Navigation principale"\]\s*>\s*nav button\s*\{[^}]*min-height:\s*44px;[^}]*flex-shrink:\s*0;/);
  assert.match(css, /\[role="dialog"\]\[aria-label="Navigation mobile"\]\s+aside\[aria-label="Navigation principale"\]\s*\{[^}]*z-index:\s*0;/);
});
