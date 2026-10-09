const assert = require('node:assert/strict');
const { test } = require('node:test');
const { administrationDom, shadow } = require('./support/administration-dom.cjs');

test('actual administration page retains root typography after a later shared body font', async t => {
  const dom = await administrationDom(t);
  const later = dom.document.createElement('style'); later.textContent = 'body { font-family: Arial; }'; dom.document.head.append(later);
  assert.equal(dom.style(dom.document.documentElement).fontSize, '17px');
  assert.equal(dom.style(dom.document.body).fontFamily, 'system-ui, sans-serif');
  assert.equal(dom.document.querySelector('.administration-console') !== null, true);
  assert.deepEqual(dom.bff.requests.map(({ method, template }) => `${method} ${template}`).sort(), [
    'GET /bff/admin/groups', 'GET /bff/admin/roles', 'GET /bff/admin/sessions',
    'GET /bff/admin/sessions/history', 'GET /bff/admin/users', 'GET /me',
  ]);
});

test('actual published sidebar receives the reference shadow and seven nonshrinking rows', async t => {
  const dom = await administrationDom(t), sidebar = dom.document.querySelector('aside[aria-label="Navigation principale"]');
  assert.equal(dom.style(sidebar).position, 'relative'); assert.equal(dom.style(sidebar).zIndex, '20');
  assert.deepEqual(shadow(dom.window, dom.style(sidebar).boxShadow), [{ lengths: [8, 0, 24, 0], color: 'rgba(12, 28, 48, 0.28)' }]);
  const buttons = [...sidebar.querySelectorAll('nav button')];
  assert.deepEqual(buttons.map(button => button.textContent), ['Tableau de bord', 'Projets', 'Messagerie', 'Formation', 'Calendrier', 'Administration', 'Paramètres']);
  for (const button of buttons) {
    assert.equal(dom.style(button).minHeight, '44px'); assert.equal(dom.style(button).flexShrink, '0');
  }
});

test('actual published drawer applies its lower sidebar layer and closes through its command', async t => {
  const dom = await administrationDom(t); await dom.click(dom.button('Ouvrir la navigation'));
  const drawer = dom.document.querySelector('[role="dialog"][aria-label="Navigation mobile"]'); assert.ok(drawer);
  assert.equal(dom.style(drawer.querySelector('aside')).zIndex, '0');
  await dom.click(dom.button('Fermer la navigation'));
  assert.equal(dom.document.querySelector('[role="dialog"][aria-label="Navigation mobile"]'), null);
});

test('actual console panels retain shadows, shrinking grid items and readable long labels', async t => {
  const dom = await administrationDom(t), console = dom.document.querySelector('.administration-console');
  const panels = [...console.querySelectorAll('.administration-panel')]; assert.ok(panels.length);
  for (const panel of panels) assert.deepEqual(shadow(dom.window, dom.style(panel).boxShadow), [
    { lengths: [0, 5, 15, 0], color: 'rgba(23, 32, 51, 0.14)' },
    { lengths: [0, 1, 3, 0], color: 'rgba(23, 32, 51, 0.12)' },
  ]);
  const gridItems = [...console.querySelectorAll('.grid > *, .overflow-x-auto')]; assert.ok(gridItems.length);
  for (const item of gridItems) assert.equal(Number.parseFloat(dom.style(item).minWidth), 0);
  const labels = [...console.querySelectorAll('h1, h2, h3, p, span, button')]; assert.ok(labels.length);
  for (const label of labels) assert.equal(dom.style(label).overflowWrap, 'anywhere');
  // Real geometry, breakpoints, hit testing and keyboard focus require a native browser.
});
