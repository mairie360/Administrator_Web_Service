const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');
const [{ mountConfirmationNavigation }] = loadTs(['src/lib/confirmation-navigation.ts']);

function fixture() {
  const listeners = new Map();
  const owner = {
    body: { style: { overflow: 'scroll' } }, activeElement: null,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name, callback) => { assert.equal(listeners.get(name), callback); listeners.delete(name); },
  };
  const control = () => ({
    disabled: false, isConnected: true, calls: 0,
    focus() { this.calls += 1; owner.activeElement = this; },
    matches() { return this.disabled; },
  });
  const opener = control(); const cancel = control(); const confirm = control();
  const dialog = { ...control(), ownerDocument: owner,
    querySelectorAll: () => [cancel, confirm].filter(c => !c.disabled),
    contains: (element) => [dialog, cancel, confirm].includes(element),
  };
  owner.activeElement = opener;
  let busy = false; let cancellations = 0;
  const stop = mountConfirmationNavigation(dialog, { cancel: () => { cancellations += 1; }, isBusy: () => busy });
  const key = (key, shiftKey = false) => {
    const event = { key, shiftKey, prevented: false, stopped: false,
      preventDefault() { this.prevented = true; }, stopPropagation() { this.stopped = true; } };
    listeners.get('keydown')(event); return event;
  };
  return { owner, opener, cancel, confirm, dialog, listeners, stop, key,
    setBusy: (value) => { busy = value; }, cancellations: () => cancellations };
}

test('confirmation begins on Cancel, locks scrolling, and restores opener and listeners', () => {
  const f = fixture();
  assert.equal(f.owner.activeElement, f.cancel);
  assert.equal(f.owner.body.style.overflow, 'hidden');
  assert.equal(f.key('Escape').stopped, true);
  assert.equal(f.cancellations(), 1);
  f.stop();
  assert.equal(f.owner.activeElement, f.opener);
  assert.equal(f.owner.body.style.overflow, 'scroll');
  assert.equal(f.listeners.size, 0);
});

test('Tab and Shift+Tab wrap inside, without replacing ordinary interior navigation', () => {
  const f = fixture();
  assert.equal(f.key('Tab').prevented, false);
  f.confirm.focus();
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.owner.activeElement, f.cancel);
  assert.equal(f.key('Tab', true).prevented, true);
  assert.equal(f.owner.activeElement, f.confirm);
  f.dialog.focus(); f.key('Tab', true);
  assert.equal(f.owner.activeElement, f.confirm);
  f.opener.focus(); f.key('Tab');
  assert.equal(f.owner.activeElement, f.cancel);
  f.stop();
});

test('focus escaping the confirmation is recovered, including when all actions are disabled', () => {
  const f = fixture();
  f.opener.focus(); f.listeners.get('focusin')();
  assert.equal(f.owner.activeElement, f.cancel);
  f.cancel.disabled = f.confirm.disabled = true;
  f.opener.focus(); f.listeners.get('focusin')();
  assert.equal(f.owner.activeElement, f.dialog);
  assert.equal(f.key('Tab').prevented, true);
  assert.equal(f.owner.activeElement, f.dialog);
  f.stop();
});

test('pending Escape is consumed without cancellation, then current state permits cancelling', () => {
  const f = fixture(); f.setBusy(true);
  assert.equal(f.key('Escape').prevented, true);
  assert.equal(f.cancellations(), 0);
  f.setBusy(false); f.key('Escape');
  assert.equal(f.cancellations(), 1);
  assert.equal(f.key('Enter').prevented, false);
  f.stop();
});

test('cleanup never focuses a removed or disabled opener', () => {
  for (const property of ['isConnected', 'disabled']) {
    const f = fixture(); f.opener[property] = property === 'disabled';
    f.stop(); assert.equal(f.opener.calls, 0);
  }
});
