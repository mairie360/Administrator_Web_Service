import http from 'k6/http';
import { check, sleep, group } from 'k6';
import crypto from 'k6/crypto';
import encoding from 'k6/encoding';

// ---------------------------------------------------------------------------
// k6 load test of the Administration front (Administrator_Web_Service).
// Two scenarios run side by side against the routes the Next.js server really serves:
//   * `reads`: the console page (behind the authentication middleware), the session adapter
//     /api/user/me (-> BFF User), /health, then the session reads /me and /session/me relayed by
//     the same-origin proxy to BFF User;
//   * `writes` (MAIR-516): the group creation and deletion an administrator performs from the
//     console, through the browser path /admin/groups (-> BFF User -> Core API).
// Authentication goes through the accessToken cookie, like in the browser: the proxy turns it
// into Authorization: Bearer for the BFF. init-test.sql gives the user the Admin role.
// ---------------------------------------------------------------------------

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
// Must match the JWT_SECRET of the core-api / bff-user services of the test stack.
const JWT_SECRET = __ENV.JWT_SECRET || 'b"secret"';
// User inserted by init-test.sql (token `sub`).
const USER_ID = __ENV.PERF_USER_ID || '2';

const STAGES = [
  { duration: '30s', target: 20 }, // ramp up
  { duration: '1m', target: 20 }, // plateau
  { duration: '10s', target: 0 }, // ramp down
];

export const options = {
  scenarios: {
    reads: { executor: 'ramping-vus', startVUs: 0, stages: STAGES, exec: 'reads', gracefulRampDown: '5s' },
    // Few VUs on purpose: every iteration writes twice in the Core API database.
    writes: { executor: 'constant-vus', vus: 3, duration: '1m40s', exec: 'writes' },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'], // < 1% of HTTP errors
    checks: ['rate>0.99'], // a redirect (307) is not an HTTP error: the checks catch it
    'http_req_duration{endpoint:page}': ['p(95)<800'], // Next.js page render
    'http_req_duration{endpoint:health}': ['p(95)<150'], // same-origin proxy -> BFF /health
    'http_req_duration{endpoint:session}': ['p(95)<500'], // /api/user/me -> BFF User -> Core
    'http_req_duration{endpoint:user}': ['p(95)<500'], // proxy + BFF aggregation + upstream
    'http_req_duration{endpoint:group-create}': ['p(95)<800'], // proxy -> BFF User -> Core API insert
    'http_req_duration{endpoint:group-delete}': ['p(95)<800'], // proxy -> BFF User -> Core API delete
  },
};

function b64url(value) {
  return encoding.b64encode(value, 'rawurl');
}

// Minimal HS256 JWT accepted by Core API / BFF User (claims sub + role + exp).
function mintJwt() {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(JSON.stringify({ sub: USER_ID, role: 'user', exp: now + 3600 }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.hmac('sha256', JWT_SECRET, signingInput, 'base64rawurl');
  return `${signingInput}.${signature}`;
}

export function setup() {
  return { token: mintJwt() };
}

export function reads(data) {
  const cookie = { Cookie: `accessToken=${data.token}` };
  // redirects: 0 : a redirect (e.g. to the Login front when the cookie is refused)
  // must fail the check instead of being followed outside the stack.
  const pageParams = { headers: cookie, redirects: 0, tags: { endpoint: 'page' } };
  const dataParams = { headers: { ...cookie, Accept: 'application/json' }, redirects: 0, tags: { endpoint: 'user' } };

  group('pages', () => {
    const home = http.get(`${BASE_URL}/`, pageParams);
    check(home, { 'page / 200': (r) => r.status === 200 });
  });

  group('health', () => {
    const res = http.get(`${BASE_URL}/health`, { headers: cookie, redirects: 0, tags: { endpoint: 'health' } });
    check(res, { 'health 200': (r) => r.status === 200 });
  });

  group('session', () => {
    const me = http.get(`${BASE_URL}/api/user/me`, { headers: cookie, redirects: 0, tags: { endpoint: 'session' } });
    check(me, { '/api/user/me 200': (r) => r.status === 200 });
  });

  group('user reads', () => {
    const me = http.get(`${BASE_URL}/me`, dataParams);
    check(me, { '/me 200': (r) => r.status === 200 });

    const sessionMe = http.get(`${BASE_URL}/session/me`, dataParams);
    check(sessionMe, { '/session/me 200': (r) => r.status === 200 });
  });

  sleep(1);
}

function createdId(response) {
  try {
    const body = response.json();
    const id = body && (body.id !== undefined ? body.id : body.group && body.group.id);
    return id === undefined || id === null ? null : String(id);
  } catch {
    return null;
  }
}

export function writes(data) {
  const headers = { Cookie: `accessToken=${data.token}`, Accept: 'application/json', 'Content-Type': 'application/json' };

  group('group lifecycle', () => {
    // Unique name per iteration: Core API refuses duplicates and the cleanup below removes it.
    const name = `k6 ${__VU}-${__ITER}-${Date.now()}`;
    const created = http.post(
      `${BASE_URL}/admin/groups`,
      JSON.stringify({ name, description: 'Temporary group of the k6 load test' }),
      { headers, redirects: 0, tags: { endpoint: 'group-create' } },
    );
    const id = createdId(created);
    const ok = check(created, {
      'POST /admin/groups 200': (r) => r.status === 200,
      'POST /admin/groups returns the group id': () => id !== null,
    });
    if (!ok) return;

    const deleted = http.del(`${BASE_URL}/admin/groups/${id}`, null, {
      headers: { Cookie: headers.Cookie, Accept: 'application/json' },
      redirects: 0,
      tags: { endpoint: 'group-delete' },
    });
    check(deleted, { 'DELETE /admin/groups/{id} 200 or 204': (r) => r.status === 200 || r.status === 204 });
  });

  sleep(1);
}
