const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadTs } = require('./support/front-harness.cjs');
const [{ administrationSessionState: state, nextSessionExpiryDelay: delay }] = loadTs(['src/lib/administration-session-state.ts']);
const now = Date.parse('2026-10-02T10:00:00Z');
const session = (expires_at, revoked_at = null) => ({ expires_at, revoked_at });

test('session state uses expiry, including the exact boundary, and revocation wins', () => {
  assert.equal(state(session('2026-10-02T10:00:01Z'), now), 'active');
  assert.equal(state(session('2026-10-02T10:00:00Z'), now), 'expired');
  assert.equal(state(session('2026-09-12T10:00:00Z'), now), 'expired');
  assert.equal(state(session('2100-01-01T00:00:00Z', '2026-10-01T10:00:00Z'), now), 'revoked');
  assert.equal(state(session('2026-09-12T10:00:00Z', '2026-10-01T10:00:00Z'), now), 'revoked');
});

test('missing or invalid expiry never claims an active session', () => {
  for (const value of [null, undefined, '', 'invalid']) assert.equal(state(session(value), now), 'unknown');
  assert.equal(state(session('invalid', '2026-10-01T10:00:00Z'), now), 'revoked');
});

test('one table timer selects the nearest live expiry and skips revoked, past and invalid dates', () => {
  assert.equal(delay([], now), null);
  assert.equal(delay([session('invalid'), session(null), session('2026-09-12T10:00:00Z')], now), null);
  assert.equal(delay([
    session('2026-10-02T10:00:01Z', '2026-10-01T10:00:00Z'),
    session('2026-10-02T10:00:06Z'), session('2026-10-02T10:00:02Z'),
  ], now), 2001);
  assert.equal(delay([session('2026-10-02T10:00:00Z')], now), null);
  assert.equal(delay([session('2100-01-01T00:00:00Z')], now), 2_147_483_647);
});
