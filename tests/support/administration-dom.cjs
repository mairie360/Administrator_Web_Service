const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');
const { FrontHarness, loadTs, ROOT, BFF_URL_VARIABLES } = require('./front-harness.cjs');
const { ContractMockServer } = require('./contract-mock-server.cjs');
const { bffUserContract } = require('./bff-user-contract.cjs');

let serverAccess;

/** Actual page, React hooks, published shell and contract-gated HTTP responses. */
async function administrationDom(t, { serverPage = false, strict = false, configure, searchParams = {}, expected = "Aucun utilisateur disponible." } = {}) {
  const keys = ['window', 'document', 'HTMLElement', 'Element', 'Node', 'SVGElement',
    'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent',
    'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame',
    'ResizeObserver', 'IS_REACT_ACT_ENVIRONMENT'];
  const previous = Object.fromEntries(keys.map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  const environmentKeys = [...BFF_URL_VARIABLES, "LOGIN_FRONT_URL", "ADMINISTRATION_FRONT_URL"];
  const env = Object.fromEntries(environmentKeys.map(key => [key, process.env[key]]));
  const errors = [], console = new VirtualConsole();
  console.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="root"></div></body></html>', {
    url: 'http://administration.mairie360.test/', pretendToBeVisual: true, virtualConsole: console,
  });
  const bff = new ContractMockServer('BFF_USER', bffUserContract());
  let front, root, React, setBrowserFrontUrls;
  t.after(async () => {
    try {
      if (root) await React.act(async () => root.unmount());
      serverAccess = undefined;
      setBrowserFrontUrls?.({}); front?.uninstall(); dom.window.close(); await bff.stop();
      assert.deepEqual([...bff.violations, ...(front?.violations || [])], []);
      assert.deepEqual(errors, [], 'Actual consumer CSS and DOM effects must be accepted');
    } finally {
      for (const key of environmentKeys) {
        if (env[key] === undefined) delete process.env[key]; else process.env[key] = env[key];
      }
      for (const key of keys) {
        if (previous[key]) Object.defineProperty(globalThis, key, previous[key]); else delete globalThis[key];
      }
    }
  });
  for (const key of keys.slice(0, 12)) Object.defineProperty(globalThis, key, {
    configurable: true, writable: true, value: key === 'window' ? dom.window : key === 'document' ? dom.window.document : dom.window[key],
  });
  global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
  global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
  global.IS_REACT_ACT_ENVIRONMENT = true;
  // Platform adapters do not emulate media queries, layout or native scrolling.
  dom.window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
  dom.window.ResizeObserver = global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  dom.window.HTMLElement.prototype.scrollIntoView = () => {};
  const style = dom.window.document.createElement('style');
  style.textContent = fs.readFileSync(path.join(ROOT, 'src/app/globals.css'), 'utf8'); dom.window.document.head.append(style);
  await bff.start(); front = new FrontHarness({ bff }).install();
  bff.on('get', '/me', { body: {
    user: { id: 1, first_name: 'Alice', last_name: 'Dupont', email: 'alice@mairie.test', phone: '+33123456789', status: 'active' },
    groups: [], roles: [{ id: 1, name: 'Admin' }],
  } });
  for (const [route, body] of [
    ['roles', { roles: [] }], ['groups', { groups: [] }], ['sessions', { sessions: [] }],
    ['sessions/history', { sessions: [] }], ['users', { users: [], page: 1, page_size: 20, total: 0, total_pages: 0 }],
  ]) bff.on('get', '/admin/' + route, { body });
  [{ setBrowserFrontUrls }] = loadTs(['src/lib/front-urls.ts']);
  setBrowserFrontUrls({ ADMINISTRATION_FRONT_URL: 'http://administration.mairie360.test/', LOGIN_FRONT_URL: 'https://login.example/',
    DASHBOARD_FRONT_URL: 'https://dashboard.example/', PROJECT_FRONT_URL: 'https://projects.example/',
    CALENDAR_FRONT_URL: 'https://calendar.example/', MESSAGE_FRONT_URL: 'https://messages.example/',
    ELEARNING_FRONT_URL: 'https://training.example/', SETTINGS_FRONT_URL: 'https://settings.example/' });
  configure?.(bff);
  React = require('react');
  const { createRoot } = require('react-dom/client'), [{ default: Home }] = loadTs(['src/components/administration-page.tsx']);
  let page = React.createElement(Home);
  if (serverPage) {
    front.uninstall();
    process.env.BFF_ADMIN_BASE_URL = bff.url;
    process.env.ADMINISTRATION_FRONT_URL = 'http://administration.mairie360.test';
    process.env.LOGIN_FRONT_URL = front.ownerOrigin;
    serverAccess = front.cookie;
    const [{ default: ServerPage }] = loadTs(['src/app/page.tsx'], { stubs: { 'next/headers': { cookies: async () => ({ get: key => { assert.equal(key, 'accessToken'); return { value: serverAccess }; } }) } } });
    dom.reconfigure({ url: 'http://administration.mairie360.test/?' + new URLSearchParams(searchParams) });
    page = await ServerPage({ searchParams: Promise.resolve(searchParams) });
    front.install();
  }
  root = createRoot(dom.window.document.getElementById('root'));
  const shell = React.createElement(require('@mairie360/front-kit/react').InstanceProvider, { role: 'Admin', timeZone: 'UTC' }, page);
  await React.act(async () => root.render(strict ? React.createElement(React.StrictMode, null, shell) : shell));
  const loaded = () => dom.window.document.body.textContent.includes(expected) &&
    [...dom.window.document.querySelectorAll('button')].some(button => button.textContent.trim() === 'Actualiser' && !button.disabled);
  for (let attempt = 0; attempt < 100 && !loaded(); attempt += 1) {
    await React.act(async () => new Promise(resolve => setTimeout(resolve, 10)));
  }
  assert.ok(dom.window.document.body.textContent.includes('Alice Dupont'));
  assert.ok(dom.window.document.body.textContent.includes(expected));
  assert.ok(loaded(), 'Wait for every console source, independently of the users panel');
  const button = name => [...dom.window.document.querySelectorAll('button')].find(element =>
    element.getAttribute('aria-label') === name || element.textContent.trim() === name);
  return { waitFor: async predicate => {
      for (let attempt = 0; attempt < 100 && !predicate(); attempt++) await React.act(async () => new Promise(resolve => setTimeout(resolve, 10)));
      assert.ok(predicate(), 'Expected consumer state to settle');
    }, document: dom.window.document, window: dom.window, bff, front, button,
    style: element => dom.window.getComputedStyle(element),
    click: async element => {
      assert.ok(element, 'Expected a real rendered command');
      await React.act(async () => element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true })));
    } };
}

function shadow(window, value) {
  return value.split(/,(?![^()]*\))/).map(part => {
    const tokens = part.trim().split(/\s+(?![^()]*\))/);
    const lengths = tokens.filter(token => Number.isFinite(Number.parseFloat(token)));
    const colors = tokens.filter(token => !Number.isFinite(Number.parseFloat(token)));
    assert.ok([3, 4].includes(lengths.length)); assert.equal(colors.length, 1);
    const pixels = lengths.map(token => {
      const number = Number.parseFloat(token); assert.ok(number === 0 || token.endsWith('px')); return number;
    });
    if (pixels.length === 3) pixels.push(0);
    const probe = window.document.createElement('span'); probe.style.color = colors[0]; window.document.body.append(probe);
    try { return { lengths: pixels, color: window.getComputedStyle(probe).color }; } finally { probe.remove(); }
  });
}

module.exports = { administrationDom, shadow };
