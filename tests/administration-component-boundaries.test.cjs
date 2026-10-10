const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ts, parse, nodes, imported, exportedCallable, bindingNames } = require('./support/module-policy.cjs');
// Structural policy; existing page/form/rerender tests exercise user behavior.
for (const [component, filename] of [['UsersPanel', 'users-panel'], ['RolesPanel', 'roles-panel'], ['GroupsPanel', 'groups-panel'], ['SessionsPanel', 'sessions-panel']]) {
  test(`${component} has a stable explicit module boundary, not an inline console definition`, () => {
    const consoleSource = parse('src/components/administration-console.tsx');
    const directImport = imported(consoleSource).find(row => row.specifier === `./administration/${filename}`)?.node;
    assert.ok(directImport, `${component} must be imported directly`);
    const bindings = directImport.importClause?.namedBindings;
    assert.ok(bindings && ts.isNamedImports(bindings));
    const binding = bindings.elements.find(node => (node.propertyName?.text ?? node.name.text) === component);
    assert.ok(binding);
    // Reject shadowed panel definitions inside the console as well as at its top level.
    assert.equal(nodes(consoleSource, node => bindingNames(node).includes(binding.name.text)).length, 0);
    const panel = parse(`src/components/administration/${filename}.tsx`);
    assert.equal(panel.statements[0].expression?.text, 'use client');
    assert.ok(exportedCallable(panel, component), `${component} must be a top-level export`);
    assert.equal(imported(panel).some(row => /administration-console/.test(row.specifier)), false);
  });
}
test('shared field, panel, action and confirmation rendering has no administration data dependency', () => {
  const ui = parse('src/components/administration/controls.tsx');
  for (const name of ['Field', 'Panel', 'ActionButton', 'EmptyState']) assert.ok(exportedCallable(ui, name));
  const confirmation = parse('src/components/administration/confirm-modal.tsx');
  assert.ok(exportedCallable(confirmation, 'ConfirmModal'));
  for (const source of [ui, confirmation]) assert.ok(imported(source).every(row => !/administration-api|bff-client|auth-session|administration-console/.test(row.specifier)));
});
