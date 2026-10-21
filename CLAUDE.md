# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Next.js 16 (App Router, React 19, TypeScript, Tailwind 4) web service for Mairie360 hosting the administration interface (users, roles, groups, sessions). The browser only talks to this app's own origin; the Next.js server forwards data calls to **BFF_user**. UI building blocks come from the private package `@mairie360/lib-components`. Docs are bilingual: `docs/en|fr/module.md` (functional) and `docs/en|fr/technical.md` (routes, config, troubleshooting) — update both languages together. `BFF.md` / `BACKEND.md` contain *proposed* backend needs; the OpenAPI snapshot is the source of truth for implemented behaviour.

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

Tests are plain CommonJS `node:test` files matching `tests/*.test.cjs` (no Jest/Vitest, no DOM). `npm test` fails below 60% lines/branches/functions, but node only measures `src/` modules a test actually loads (`src/app/page.tsx` and `administration-console.tsx` are loaded by `administration-page-html.bff-mock.test.cjs` only).

- `proxy.test.cjs` / `security-headers.test.cjs` use a minimal inline `require.extensions['.ts']` hook that does **not** resolve `@/*`, and stub `global.fetch`.
- `*.bff-mock.test.cjs` and `network-contract.test.cjs` use `tests/support/`: `loadTs()` (transpiles TS, resolves `@/*`, can stub modules such as `react` to run `useAuthSession` without a DOM), `ContractMockServer` (a real HTTP fake BFF User driven by `contracts/openapi.json` via `bff-user-contract.cjs`, same validator as `BFF_user/tests/support`) and `FrontHarness` (replaces `global.fetch`: relative URLs go through `middleware.ts` then the matching `src/app/**/route.ts`, absolute URLs are allowed only to the mock; `useBffUrl()` sets exactly one BFF URL variable). Each test asserts `bff.violations` and `front.violations` are empty, so an out-of-contract request/response, an unmocked call or a call to another host fails it. The package contract only types `2XX` (plus `412` on login), so every error reply must use `bffError(status)` (`outOfContract: true`); success replies must match their schema (204/205/304 bodies are not checked).
- `administration-page-html.bff-mock.test.cjs` renders the real `src/app/page.tsx` (`AppShell` around the BFF-backed local `AdministrationConsole`, session from `/api/user/me`) through `tests/support/server-view.cjs` (`react-dom/server` with hook state kept between passes, same file in every front, see `../CLAUDE.md`) on `FrontHarness`: metrics and tables from `/admin/*`, tab switching, 401 and partial failures, refresh and the 401 → logout of the shell are asserted on the HTML. `loadTs` transpiles `.tsx` with `jsx: react-jsx`.
- `network-contract.test.cjs` pins that `@mairie360/bff-user-openapi` is an accepted exact version (`scripts/contract-version.mjs`: a release `X.Y.Z`, a `0.0.0-dev.<sha40>` dev package or, since MAIR-600, a `0.0.0-staging.<sha40>` staging package of the same `main` commit; `0.0.0-staging.<short sha>` and ranges are refused) installed as locked, that it is the only `bff-*-openapi` package and `bff-user` the only BFF image of the Docker stacks, tagged with the image built from the same commit (`X.Y.Z`, `dev-<sha7>` for a dev package, or `staging-<sha7>` for a staging package), that `contracts/openapi.json` deep-equals `buildOrvalOpenApi()`, that the proxy and the session adapters resolve the same BFF URL (only `bff-proxy.ts` reads it from `process.env`), that every contract operation is relayed, that nothing off-contract reaches the BFF (only `/openapi.json`/`/swagger.json` are relayed as an exception) and that only `bff-client.ts`, `auth-session.ts` and `bff-proxy.ts` call `fetch`. `administration-api.bff-mock.test.cjs` fails if a `/admin/*` contract operation is not exercised, so a package bump that adds one requires a new test.

### OpenAPI contract

The only contract is **BFF User's, as published in `@mairie360/bff-user-openapi`**, pinned to an exact version in `package.json`: a release `X.Y.Z`, or the `0.0.0-dev.<sha>` package the CICD publishes for each commit of BFF_user `main` (used since MAIR-509 while no release is cut), or, once that commit is released on staging, the `0.0.0-staging.<sha40>` package of the same commit, preferred on a staging release for readability (MAIR-600). Never copy it from a BFF checkout: the local `BFFs/BFF_user` can be ahead of what is published. The package is orval output (`endpoints/bffUser.ts` + `model/*.ts`, no `openapi.json`, and its `main` points to a missing `index.ts`), so:

- `scripts/orval-contract.mjs` (identical to `Login_Web_Service`'s, an ESM port of `BFFs/BFF_user/tests/support/orval-contract.ts`) rebuilds an OpenAPI document from it with the TypeScript compiler API; `contracts:sync` writes it to the committed `contracts/openapi.json`, which the proxy imports at build time and the tests load. Never hand-edit it.
- orval keeps paths, methods, parameters, bodies, success models and JSDoc constraints (`@minLength`, `@nullable`…). It drops formats, examples, response headers and error statuses: success is `2XX`, only models named `<OperationId><status>` (`PostAuthLogin412`) document another status.
- `src/lib/administration-api.ts` imports its types from `@mairie360/bff-user-openapi/model` (re-exported for `administration-console.tsx`). There is no generated `.d.ts`.

```bash
npm run contracts:sync      # (= contracts:generate) rebuild contracts/openapi.json from the installed package
npm run contracts:check     # fail if the version isn't an accepted exact version, installed != package.json, a second bff-*-openapi exists, or the snapshot is stale
```

These commands run offline. After a bump, move the `bff-user` image tag of the `docker-compose*.yml` files to the image built from the same commit. The stacks also pin dev images of Core API and the database: the dev Liquibase needs `-Dallow_template_admin=true`, the database enforces argon2id hashes in `init-test.sql`, the dev Core API needs `JWT_ALLOW_WEAK_SECRET` for the shared test secret and `RATE_LIMIT_ENABLED=false`, and BFF User needs `AUTH_RATE_LIMIT_ENABLED=false` for the ZAP scan. Nullable orval enums (`typeof X[keyof typeof X] | null`) become `{ type: ['string','null'], enum: [..., null] }`; BFF errors use the shared `ErrorResponse` envelope (`{ error: { code, message, details } }`).

## Figma mockup

Figma is the source of truth: design and agree any UI change on **Mairie360 – Administrator_Web_Service** (https://www.figma.com/design/DexDzPaw4RFep5J9aqb1fE) first, then code it. Shared components come from the lib mockup https://www.figma.com/design/T7vetUfuzPEXk5TxjHRiO2 and are instantiated, never redrawn.

## Architecture

- **Sessions through the lib `SessionList` (MAIR-607)** — `src/components/administration/sessions-panel.tsx` keeps the Actives / Historique switch and the refresh action but renders `SessionList` from `@mairie360/lib-components/primitives` (states computed by the lib `sessionState`, one expiry timer). No local session table or `src/lib/administration-session-state.ts` (pinned by `tests/lib-session-list-adoption.test.cjs`; `tests/administration-session-state.test.cjs` now checks the lib helpers).
- **Shell from the lib (MAIR-578)** — `src/components/administration-page.tsx` renders `AccessibleShell` from `@mairie360/lib-components/shell` (the shell stays inert while a local `alertdialog` confirmation is open); `src/lib/front-urls-provider.tsx` uses the lib `configureSidebarCookieDomain`. No local `accessible-shell.tsx`, `desktop-navigation.tsx` or `sidebar-preference.ts` (pinned by `tests/lib-shell-adoption.test.cjs`).

- **Console boundaries (MAIR-406 / issue146)** — `administration-console.tsx`
  owns global reads, revisions and mutation orchestration. Four stable top-level
  panels are imported directly from `src/components/administration/`; local
  state/callbacks/mount semantics stay unchanged. Shared `controls.tsx` and
  `confirm-modal.tsx` have no administration data dependency; `types.ts` only
  exports `RunAction`. No barrel/cycle, new effect/fetch or lazy boundary. The
  component-boundary suite and HTML refresh regression cover extraction and
  preservation of active drafts/history, not deployed authorization.

- **Shared shell and profile routing (MAIR-180)** — `src/app/page.tsx` passes the
  active module, session user, logout callback and runtime front URLs to the
  library `AppShell`. There is no local Sidebar/Header/Footer composition or
  `/profile` page. For authenticated legacy `/profile` bookmarks,
  `src/middleware.ts` redirects to the validated `SETTINGS_FRONT_URL`; a missing,
  unsafe or looping destination returns an uncached 503.

- **Contract-gated catch-all proxy** — `src/app/[...path]/route.ts` exports `proxyBffRequest` (`src/lib/bff-proxy.ts`) for every method. It matches the path against `contracts/openapi.json` `paths` (brace segments are wildcards): unknown path → 404, method not declared → 405 with `Allow`, `.`/`..` segments → 400; `/openapi.json` and `/swagger.json` are always forwarded. **A BFF route is therefore reachable from the browser only once the synced contract declares it.**
- **`forwardToBff`** strips hop-by-hop headers and the `cookie` header, turns the `accessToken` cookie into `Authorization: Bearer` when no Authorization header is present, keeps the query string and raw (binary) body, uses `redirect: 'manual'`, a 15 s timeout and `Cache-Control: no-store`, preserves upstream status/headers (including `Set-Cookie`, empty 204/205/304 bodies) and returns a controlled 502 JSON error when the BFF is unreachable. `tests/proxy.test.cjs` pins this behaviour.
- **Single BFF URL** — BFF User is the only BFF. `configuredBffUrl()` (`src/lib/bff-proxy.ts`) resolves `BFF_ADMIN_BASE_URL` → `USER_BFF_URL` → `BFF_USER_API_URL` → `NEXT_PUBLIC_BFF_ADMIN_BASE_URL` at request time for both proxy and session adapters; missing or invalid configuration returns an uncached 503. Configure the URL explicitly for local development too; don't read a BFF URL anywhere else.
- **Session adapters** — `src/app/api/{user/me,auth/me,auth/session,auth/logout}/route.ts` call `userBffRequest` (`src/lib/user-bff-proxy.ts`), i.e. `forwardToBff(request, configuredBffUrl(), path)`. `src/lib/auth-session.ts` (`useAuthSession`) loads `/api/user/me`, normalises roles (`Admin`/`Responsable`/`Maire`/`User`/`Guest`, with FR/EN aliases) and on 401 calls `logoutAndReload()`.
- **Auth gate** — `src/middleware.ts` redirects every page request (matcher excludes `/api` and the BFF contract roots (their own 401 is relayed), `/_next/*` and paths with a dot) to `LOGIN_FRONT_URL` when the `accessToken` cookie is missing or its JWT `exp` is past, clearing the cookie on `COOKIE_DOMAIN`. It only decodes the payload; signature validation is the BFF/Core's job. For authenticated requests it also sets a per-request nonce `Content-Security-Policy` (built in `src/lib/content-security-policy.ts`, forwarded to Next.js via request headers), which is why `src/app/layout.tsx` forces dynamic rendering: a prerendered page would carry no nonce and its scripts would be blocked. Any new external origin (images, fonts, browser-side API calls) must be added to that policy. The catch-all data routes (e.g. `/health`, `/admin/*`) also pass through it, so a data call without a valid cookie gets a redirect to Login, not a 401.
- **Client calls** — `requestBff` (`src/lib/bff-client.ts`) calls same-origin paths and adds `Accept`/`Content-Type` JSON headers. It never reads/migrates browser JWT storage to inject Authorization (MAIR-406); the existing proxy owns cookie forwarding. Explicit caller headers remain unchanged. Historical storage helpers remain available for existing cleanup, not automatic data requests. Fetch uses manual redirects; after the caller signal is checked, an opaque redirect reloads the current protected document once per browser Location and throws `BffNavigationRequiredError`, without inspecting its destination/body or replaying writes. Existing middleware owns Login and the page's return path/query. Ordinary non-2xx responses still throw `BffRequestError(status)` without parsing their body; generic network errors do not imply expiration. `administration-api.ts` checks the contract bounds (search ≤ 100, password 8–255, group name 1–64, description ≤ 2000) before calling. This slice does not certify cookie signatures, deployed administrator authorization, token-based session management or real Login authentication.
- **Page and data** — `/` mounts `src/components/administration-console.tsx` (users/roles/groups/sessions tabs) inside the shared `AppShell` only after unchanged `useAuthSession` resolves Admin. Pending profiles show a status, other resolved roles see an access-reserved state, and profile errors offer document-reload retry without console reads. The page does not enforce server authorization or revalidate stale roles; 401 logout remains in the hook. The local typed client `src/lib/administration-api.ts` calls the existing `/admin/*` contract; the library supplies only navigation and layout, never demonstration data.
- `src/lib/front-urls.ts` resolves `*_FRONT_URL` destinations when the page renders. The shared shell hides unconfigured modules; E-mails and Files remain archived and are not passed to it.
- `next.config.ts` sets `output: 'standalone'` (required by the Dockerfile), `poweredByHeader: false` and static security headers on every route (`tests/security-headers.test.cjs` pins them, and the ZAP baseline fails without them), and inlines the `*_FRONT_URL` values at **build time** (defaults `https://<module>.dev.mairie360-eip.fr/`), so changing them requires a rebuild.
- **Text constraints of the contract (MAIR-514)** — `src/lib/text-constraints.ts` mirrors the published admin rules: `NO_MARKUP_PATTERN` (HTML form of `^[^<>]*$`) with `NO_MARKUP_HINT` as `title`, `PHONE_PATTERN`/`PHONE_HINT` (`^(?:\+?[\d\s.()-]+)?$`), and the lengths (`NAME_MAX_LENGTH` 64, `EMAIL_MAX_LENGTH` 320, `PHONE_MAX_LENGTH` 32, `PASSWORD_MAX_LENGTH` 255, `DESCRIPTION_MAX_LENGTH` 2 000). The user, role and group inputs carry them; textareas (no `pattern`) report `<`/`>` through `reportMarkupValidity` (`setCustomValidity`). `BffRequestError` now reads the ErrorResponse body and exposes `details[]`; `administrationErrorMessage` lists them per field for a 400/422 (`describeValidationDetail`: `body.first_name` → `Prénom : ne doit pas contenir les caractères < ou >`) and keeps its generic wording without details. The HTML test pins the patterns and lengths to `contracts/openapi.json`.

## CI/CD

- `.github/workflows/cicd.yml` calls `mairie360/CICD/.github/workflows/frontend-cicd.yml@<sha>` pinned to a CICD commit (`package_name: administrator-front`, `node_version: "24.21.0"`, `cicd_version` = the same sha, each followed by a `# vX.Y.Z` comment so Renovate bumps them together with `dev-dependency-exception.yml`; `tests/cicd-pin.test.cjs` checks they agree) and passes only the `CODECOV_TOKEN` and `N8N_WEBHOOK_SECRET` secrets plus the release-journal ones (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`, org secrets used by CICD to commit `RELEASE_JOURNAL.md` on `main` after each release). It runs on `pull_request`, `workflow_dispatch` and on `push` to `main` only, so a PR branch no longer runs the pipeline twice (MAIR-436). The workflow token is read-only by default (`permissions: contents: read`); only the `CICD` job gets `contents`/`packages`/`id-token: write`, the cap the reusable workflow needs for its release jobs (dev image push + cosign signature, prod tag). `tests/workflow-permissions.test.cjs` (identical in the eight fronts) pins both rules. A separate read-only `required_security_scan` job runs Semgrep and Gitleaks under the legacy required check name. The reusable pipeline runs `npm ci` → `npm run lint` + `npm audit --omit=dev --audit-level=high` (blocking; the full audit is report-only) + Semgrep/Gitleaks → `npm run build` + `npm test` (Codecov) → on `main`, builds `Dockerfile` with the token as the BuildKit secret `node_auth_token` (never a build arg), scans it with Trivy, signs it with cosign and pushes `ghcr.io/mairie360/administrator-front:dev-<sha>`. Some jobs set up Node without a registry, so the committed `.npmrc` must keep the `@mairie360` registry + `${NODE_AUTH_TOKEN}` lines.
- `.github/workflows/contracts.yml` (exact Node 24.21.0) runs `contracts:check` and `test:contracts` on every PR and on pushes to `main`.
- `.releaserc.json`: semantic-release on `main` (conventionalcommits preset, GitHub release only, no npm publish), so commit types drive versions. `.github/workflows/auto-approve.yml` auto-approves `renovate[bot]` PRs.
- `Dockerfile`: two-stage `node:<ver>-bookworm-slim` build, standalone output, non-root `nextjs` user, `PORT=5000`, `CMD node server.js`.

## Isolated security & performance tests

Same pattern as the APIs/BFFs, adapted to a web front. Not part of `npm test`; they need Docker and `NODE_AUTH_TOKEN` (the front image is built from the production `Dockerfile`).

- `./security_test.sh` → `docker-compose-security.yml`: full isolated upstream stack (Postgres + Liquibase + `init-test.sql` seed, Redis, Core API, BFF User; published GHCR images, versions overridable via `*_IMAGE` env vars) + this front, then `zap-baseline.py` (classic spider + AJAX spider `-j`, which renders the console in a headless browser so the BFF contract routes fetched by the bundle are scanned too, + passive scan) authenticated with a static `accessToken` cookie. Any WARN/FAIL alert not set to IGNORE in `.zap/rules.tsv` fails the run; since MAIR-516 the server-error rule (100000) is no longer ignored, so a 5xx relayed by the proxy fails the scan.
- `./performance_test.sh` → `docker-compose-performance.yml`: same stack + k6 running `load-test.js`: a `reads` scenario (pages, `/health`, `/api/user/me`, `/me`, `/session/me` through the proxy) and a `writes` scenario (MAIR-516) that creates then deletes a group through `/admin/groups`, both with a JWT minted from `JWT_SECRET`; strict status checks and per-endpoint thresholds fail the run.
- Test user is id 2 (seeded in `init-test.sql` with the `User` and `Admin` roles, so the administration routes answer instead of 403); every service shares `JWT_SECRET=b"secret"`. `TARGET_IMAGE` lets the stacks reuse a pre-built front image. These files are excluded from the image by `.dockerignore`.

## Gotchas

- `docker-compose.yml` is a local dev stack (Postgres + Liquibase + seed, Redis, Core API, BFF User, this front built from the production `Dockerfile`), the same services as `docker-compose-security.yml` / `docker-compose-performance.yml` minus their ZAP/k6 test-runner containers. It publishes the front on `localhost:5000` and needs `NODE_AUTH_TOKEN` exported for the build. `development.Dockerfile` (the unused `projects`-behind-nginx template) has been removed.

## Pull request reviewers

Every PR requests a review from the whole team, minus its author: `CarolinHugo`, `LAURETbenjamin`, `MathTek` and `Quentintnrl` (`gh pr create … --reviewer CarolinHugo,LAURETbenjamin,MathTek`). `.github/CODEOWNERS` makes GitHub request them automatically as well.
