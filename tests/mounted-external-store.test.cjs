const assert = require('node:assert/strict');
const { test } = require('node:test');
const { installReactRuntime, mount } = require('./support/server-view.cjs');
installReactRuntime();
const React = require('react');

test('the mounted-client harness reads and subscribes to the client store and unsubscribes on removal', async () => {
  let value = 'client receipt';
  const listeners = new Set();
  const subscribe = listener => { listeners.add(listener); return () => listeners.delete(listener); };
  const getSnapshot = () => value;
  let renders = 0;
  function Display() {
    renders += 1;
    const receipt = React.useSyncExternalStore(subscribe, getSnapshot, () => 'server receipt');
    return React.createElement('p', null, receipt);
  }
  assert.match(require('react-dom/server').renderToStaticMarkup(React.createElement(Display)), /server receipt/);
  assert.equal(listeners.size, 0);
  const view = mount(React.createElement(Display));
  try {
    await view.settle();
    assert.match(view.html, /client receipt/);
    assert.doesNotMatch(view.html, /server receipt/);
    assert.equal(listeners.size, 1);
    await view.act(() => { value = 'confirmed update'; for (const listener of listeners) listener(); });
    assert.match(view.html, /confirmed update/);
    const confirmedRenders = renders;
    await view.act(() => { for (const listener of listeners) listener(); });
    assert.match(view.html, /confirmed update/);
    assert.equal(renders, confirmedRenders);
  } finally { view.unmount(); }
  assert.equal(listeners.size, 0);
});
