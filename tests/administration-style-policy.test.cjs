const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { createRequire } = require('node:module');
const { test } = require('node:test');
const postcss = createRequire(require.resolve('next/package.json'))('postcss');

test('parsed typography policy preserves the system token and avoids global size overrides', () => {
  const parsed = postcss.parse(readFileSync(join(__dirname, '../src/app/globals.css'), 'utf8'));
  let font;
  parsed.walkDecls(declaration => {
    assert.equal(declaration.important, undefined, 'Keep ordinary stylesheet precedence');
    assert.equal(['--text-xs', '--text-sm'].includes(declaration.prop), false);
    if (declaration.prop === '--font-sans' && declaration.parent.type === 'atrule' && declaration.parent.name === 'theme') font = declaration.value.split(',').map(name => name.trim());
    if (declaration.parent.type === 'rule') {
      const selectors = declaration.parent.selectors.map(selector => selector.trim());
      assert.equal(selectors.some(selector => ['.text-xs', '.text-sm'].includes(selector)), false);
      if (['height', 'min-height', 'max-height'].includes(declaration.prop)) assert.equal(selectors.includes('header'), false);
    }
  });
  assert.deepEqual(font, ['system-ui', 'sans-serif']);
});
