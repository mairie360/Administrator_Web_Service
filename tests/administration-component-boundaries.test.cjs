const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const parse = file => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const exported = (source, name) => source.statements.find(node => ts.isFunctionDeclaration(node)
  && node.name?.text === name && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword));

for (const [component, filename] of [
  ['UsersPanel', 'users-panel'], ['RolesPanel', 'roles-panel'],
  ['GroupsPanel', 'groups-panel'], ['SessionsPanel', 'sessions-panel'],
]) {
  test(`${component} has a stable explicit module boundary, not an inline console definition`, () => {
    const consoleSource = parse('src/components/administration-console.tsx');
    assert.ok(!consoleSource.statements.some(node => ts.isFunctionDeclaration(node) && node.name?.text === component));
    const directImport = consoleSource.statements.find(node => ts.isImportDeclaration(node)
      && node.moduleSpecifier.text === `./administration/${filename}`);
    assert.ok(directImport, `${component} must be imported directly`);
    assert.ok(directImport.importClause.namedBindings.elements.some(node => node.name.text === component));
    const panel = parse(`src/components/administration/${filename}.tsx`);
    assert.equal(panel.statements[0].expression?.text, 'use client');
    assert.ok(exported(panel, component), `${component} must be a top-level export`);
    assert.doesNotMatch(read(`src/components/administration/${filename}.tsx`), /from ["'].*administration-console["']/);
  });
}

test('shared field, panel, action and confirmation rendering has no administration data dependency', () => {
  const ui = parse('src/components/administration/controls.tsx');
  for (const name of ['Field', 'Panel', 'ActionButton', 'EmptyState']) assert.ok(exported(ui, name));
  const confirmation = parse('src/components/administration/confirm-modal.tsx');
  assert.ok(exported(confirmation, 'ConfirmModal'));
  for (const source of [ui, confirmation]) {
    const imports = source.statements.filter(ts.isImportDeclaration).map(node => node.moduleSpecifier.text);
    assert.ok(imports.every(value => !/administration-api|bff-client|auth-session|administration-console/.test(value)));
  }
});
