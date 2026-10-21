const assert = require('node:assert/strict');
const { test } = require('node:test');
const { ts, parse, nodes, imported, exportedCallable, bindingNames } = require('./support/module-policy.cjs');
// Structural policy; existing page/form/rerender tests exercise user behavior.
// MAIR-608 component tree: the console imports each panel through its folder index.
const CONSOLE = 'src/components/AdministrationPage/components/AdministrationConsole';
for (const component of ['UsersPanel', 'RolesPanel', 'GroupsPanel', 'SessionsPanel']) {
  test(`${component} has a stable explicit module boundary, not an inline console definition`, () => {
    const consoleSource = parse(`${CONSOLE}/AdministrationConsole.tsx`);
    const directImport = imported(consoleSource).find(row => row.specifier === `./components/${component}`)?.node;
    assert.ok(directImport, `${component} must be imported directly`);
    const bindings = directImport.importClause?.namedBindings;
    assert.ok(bindings && ts.isNamedImports(bindings));
    const binding = bindings.elements.find(node => (node.propertyName?.text ?? node.name.text) === component);
    assert.ok(binding);
    // Reject shadowed panel definitions inside the console as well as at its top level.
    assert.equal(nodes(consoleSource, node => bindingNames(node).includes(binding.name.text)).length, 0);
    const panel = parse(`${CONSOLE}/components/${component}/${component}.tsx`);
    assert.equal(panel.statements[0].expression?.text, 'use client');
    assert.ok(exportedCallable(panel, component), `${component} must be a top-level export`);
    assert.equal(imported(panel).some(row => /administration-console/.test(row.specifier)), false);
  });
}
test('shared field, panel, action and confirmation rendering has no administration data dependency', () => {
  const sources = ['Field', 'Panel', 'ActionButton'].map(name => { const source = parse(`src/components/AdministrationPage/components/${name}/${name}.tsx`); assert.ok(exportedCallable(source, name)); return source; });
  const confirmation = parse(`${CONSOLE}/components/ConfirmModal/ConfirmModal.tsx`);
  assert.ok(exportedCallable(confirmation, 'ConfirmModal'));
  for (const source of [...sources, confirmation]) assert.ok(imported(source).every(row => !/administration-api|bff-client|auth-session|administration-console/.test(row.specifier)));
});
