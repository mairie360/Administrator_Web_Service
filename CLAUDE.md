# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 15 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the administration interface (users, roles, groups, sessions). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_user**. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

## Commands

Private `@mairie360/*` packages come from GitHub Packages: `.npmrc` reads `NODE_AUTH_TOKEN`, so export a token with `read:packages` before installing or building images.

```bash
npm ci
npm run dev -- --port 5000         # needs the BFF(s) reachable, see "BFF URL" below
npm run build && npm run start -- --port 5000
npm run lint                             # next lint (next/core-web-vitals + next/typescript)
npm test                                 # node:test on tests/*.test.cjs + lcov in coverage/lcov.info (what CI runs)
npm run test:contracts                   # same tests, no coverage
node --test --test-name-pattern="<name>" tests/proxy.test.cjs   # single test
```

Tests are plain CommonJS `node:test` files matching `tests/*.test.cjs` (no Jest/Vitest, no DOM). `npm test` fails below 60% lines/branches/functions, but node only measures `src/` modules a test actually loads (pages and `.tsx` components are never loaded).

- `proxy.test.cjs` / `security-headers.test.cjs` use a minimal inline `require.extensions['.ts']` hook that does **not** resolve `@/*`, and stub `global.fetch`.
- `*.bff-mock.test.cjs` and `network-contract.test.cjs` use `tests/support/`: `loadTs()` (transpiles TS, resolves `@/*`, can stub modules such as `react` to run `useAuthSession` without a DOM), `ContractMockServer` (a real HTTP fake BFF User driven by `contracts/openapi.json`, same validator as `BFF_user/tests/support`) and `FrontHarness` (replaces `global.fetch`: relative URLs go through `middleware.ts` then the matching `src/app/**/route.ts`, absolute URLs are allowed only to the mock). Each test asserts `bff.violations` and `front.violations` are empty, so an out-of-contract request/response, an unmocked call or a call to another host fails it. Mock replies must match the contract schema unless marked `outOfContract: true`.
- `network-contract.test.cjs` pins that every contract operation is relayed, that nothing off-contract reaches the BFF (only `/openapi.json`/`/swagger.json` are relayed as an exception), that only `bff-client.ts`, `auth-session.ts` and `bff-proxy.ts` call `fetch`, and that the snapshot equals `../../BFFs/BFF_user/contracts/openapi.json` when that checkout exists. `administration-api.bff-mock.test.cjs` fails if a `/bff/admin/*` contract operation is not exercised, so a contract sync that adds one requires a new test.

### OpenAPI contract

`contracts/openapi.json` is a committed copy of BFF_user's contract and `src/contracts/bff.d.ts` is generated from it (`openapi-typescript@7.10.1`, pinned in `scripts/contracts.mjs`). Never hand-edit either file.

```bash
BFF_CONTRACT_DIR=../../BFFs/BFF_user/contracts npm run contracts:sync   # copy the BFF contract and regenerate types
npm run contracts:generate  # regenerate types from the local snapshot
npm run contracts:check     # fail if types are stale, or if the BFF checkout at $BFF_CONTRACT_DIR has a different contract
```

The script's default source `../BFF_user/contracts` resolves to `Fronts/BFF_user`, which does not exist in the EIP checkout, so always set `BFF_CONTRACT_DIR` (without it, `check` silently skips the BFF comparison). All three commands `npm exec` `openapi-typescript`, so they need network access.

## Architecture

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **BFF URL** — `BFF_ADMIN_BASE_URL` → `USER_BFF_URL` → `BFF_USER_API_URL` → `NEXT_PUBLIC_BFF_ADMIN_BASE_URL` (fallback `http://localhost:4000`); resolved at request time on the server.
- **Session adapters** — `src/app/api/{user/me,auth/me,auth/session,auth/logout}/route.ts` call `userBffRequest` (`src/lib/user-bff-proxy.ts`), which reuses `forwardToBff` against BFF User (`USER_BFF_URL` → `BFF_USER_API_URL`, fallback `http://localhost:4000`). `src/lib/auth-session.ts` (`useAuthSession`) loads `/api/user/me`, normalises roles (`Admin`/`Responsable`/`Maire`/`User`/`Guest`, with FR/EN aliases) and on 401 calls `logoutAndReload()`.
- **Auth gate** — `src/middleware.ts` redirects every page request (matcher excludes `/api`, `/_next/*` and paths with a dot) to `LOGIN_FRONT_URL` when the `accessToken` cookie is missing or its JWT `exp` is past, clearing the cookie on `COOKIE_DOMAIN`. It only decodes the payload; signature validation is the BFF/Core's job. For authenticated requests it also sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers), which is why `src/app/layout.tsx` forces dynamic rendering: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy. The catch-all data routes (e.g. `/health`, `/bff/admin/*`) also pass through it, so a data call without a valid cookie gets a redirect to Login, not a 401.
- **Client calls** — `requestBff` (`src/lib/bff-client.ts`) calls same-origin paths, adds `Accept`/`Content-Type` JSON headers and, when no Authorization header is set, a Bearer token from `localStorage` (`mairie360.auth.jwt`, legacy `mairie360.projects.jwt` is migrated; see `src/lib/auth-token.ts`). On a non-2xx response it throws `BffRequestError(status)` and does **not** parse the error body. In normal use the proxy relies on the cookie. `requestBffWithHeaders` also returns the response headers: `administrationApi.refreshSession` uses it to replace a stored JWT with the `Authorization` header BFF User sends back (the BFF also resets the cookie). `administration-api.ts` checks the contract bounds (search ≤ 100, password 8–255, group name 1–64, description ≤ 2000) before calling.
- **Pages** — both are Client Components that wire the lib's `Sidebar`/`Header`/`Footer` to `useAuthSession` and `navigation.ts`. `/` (`src/app/page.tsx`) mounts `AdministrationModule` from `@mairie360/lib-components` with no data callbacks, so screen behaviour lives in that package (pinned `0.3.0`); check its version before debugging UI logic here. `/profile` renders the lib's `UserProfile` read-only, but the `/` header's profile link and the `profile` sidebar id both point to `SETTINGS_FRONT_URL`, not to `/profile`.
- **Unused local admin UI** — `src/components/administration-console.tsx` (users/roles/groups/sessions tabs) and its typed client `src/lib/administration-api.ts` (`/bff/admin/*`, types from `src/contracts/bff.d.ts`) are no longer imported by any page since the switch to the shared module (#28). Editing them changes nothing on screen.
- `src/lib/navigation.ts` / `src/lib/sidebar-items.ts` build the cross-module sidebar from the `*_FRONT_URL` values injected by `next.config.ts`.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them), and inlines the `*_FRONT_URL` values at **build time** (defaults `https://<module>.dev.mairie360-eip.fr/`), so changing them requires a rebuild.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@v2.0.0` (`package_name: administrator-front`, `node_version: "23"`, `cicd_version: v2.0.0`, `secrets: inherit`). Up to the dev release it runs: `npm ci` → `npm run lint` + `npm audit --audit-level=high` (high/critical advisories block) → `npm run build` → `npm test --if-present` (uploads `coverage/lcov.info` to Codecov) → on `main`, builds `Dockerfile` with `NODE_AUTH_TOKEN` as build-arg and pushes `ghcr.io/mairie360/administrator-front:dev-<sha>` / `dev-latest`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (Node 22) runs `contracts:check` and `test:contracts` on every push/PR.
- `.releaserc.json`: semantic-release on `main` (conventionalcommits preset, GitHub release only, no npm publish), so commit types drive versions. `.github/workflows/auto-approve.yml` auto-approves `renovate[bot]` PRs.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, BFF User; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (spider + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js` (pages, `/health`, `/api/user/me`, `/me`, `/session/me` through the proxy) with a JWT minted from `JWT_SECRET`; thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql`); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` and `development.Dockerfile` are still the unmodified template (a `projects` service behind an nginx that mounts a non-existent `nginx.conf`, `npm ci` without the GitHub Packages token) and do not start this module; rely on `docker-compose-security.yml` / `docker-compose-performance.yml` for a working stack definition.
