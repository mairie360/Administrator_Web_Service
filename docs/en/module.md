# Administrator_Web_Service — Module overview

## Administration V2 — MAIR-824

The console follows the V2 mock-up (Figma Administrator_Web_Service, epic MAIR-824) on
`@mairie360/lib-components` 2.9.0. Three tabs, each with its count: Users, Roles and Groups; the Sessions
tab is gone, the sessions of an account live in its record, and the Services and Security tabs were removed
from the console (the service of an agent is still chosen in the user modal).

- **Counters**: « Utilisateurs » with « ↗ N actifs » (a one-row read of the active accounts, also done by
  the server render), « Rôles » with « Modèles d’accès », « Groupes » with « Équipes de la mairie » (BFF
  User gives no member count per group, so the number of assignments of the mockup is not shown).
- **Header search** « Rechercher un agent… »: BFF User serves no global `/search`, so the field of the
  shared header searches the agents: typing opens the Users tab on that search (page 1).
- **Users**: search « Nom, e-mail ou service » (Core API matches the service name too), then the
  « Rôle : tous » and « Statut : tous » filters (Active, Invited, Inactive, Suspended), order by name,
  6 rows per page. The list stands in a bordered frame, without a titled panel; columns Utilisateur,
  Rôle (pill tags, the administrator role in purple), Statut, Service, Dernière connexion (« En ligne · N
  sessions » or the last sign-in) and Actions: edit, suspend / reactivate, delete. Initials avatars (40 px) take
  a colour derived from the name (lib 2.8.0), the e-mail follows a mail icon and the filters have no funnel (lib 2.9.0). An administrator cannot suspend or delete their own
  account. A click on the row opens the user record (identity, service, role, state, open sessions and
  those of the last 30 days, sign-out of one or of every session after a confirmation).
- **Suspension** (MAIR-904): confirmed first, it closes every session of the account and refuses
  its sign-in until « Réactiver »; roles, groups and second factors are kept.
- **Roles**: table, creation and edition in a modal, with the « Modules accessibles » the role opens
  (MAIR-916; the Admin role always keeps Administration); the deletion of a system role is refused,
  a role still held warns with the number of accounts, any other asks for a confirmation.
- **Groups**: creation in a modal with a colour of the charter palette, each card shows its colour and
  its number of projects (MAIR-923), the group opens in a side panel (members, owner, deletion);
  « Projets sans groupe » lists the projects of BFF_Project left without a group.
- The former `?tab=services` / `?tab=security&journal=<id>` links (alert e-mail) now open the Users tab.
- The header « Actualiser » reads the roles, the groups and the visible users page again; a
  refused read keeps the last confirmed rows and says so.

The shared navigation only shows the modules the role of the session opens (`modules` of `/me`; every
module while the BFF does not send them). The commune name of the header comes from `COMMUNE_NAME` (hidden when unset).


## Unknown collections are not empty — MAIR-470

Roles, groups, active sessions and session history remain unknown until their
first successful read. Their counters show an em dash; their panels distinguish
loading from unavailable and retain the existing GET-only refresh controls.
Only a valid empty response displays the empty-list message and zero count.
Subsequent read failures preserve the last received collections and drafts.
This frontend presentation does not certify deployed permissions or persistence.

## Text constraints from the BFF contract — MAIR-514

The user, role and group forms carry the rules of the published contract: names of
at most 64 characters without `<` or `>`, e-mail up to 320, phone up to 32 characters
made of digits, spaces, `.`, `-`, `(`, `)` and an optional leading `+`, temporary
password of a new account of 12 to 255 characters (an administrator never changes the
password of an existing account: the agent uses « Mot de passe oublié »), descriptions up to 2 000. The browser refuses an invalid value with a
French hint before any request. A 400 that still arrives with field details is explained
per field ("Prénom : ne doit pas contenir les caractères < ou >") instead of the generic
message.

## Sessions of an account — MAIR-894 (replaces MAIR-406)

The read-only Sessions tab of MAIR-406 is gone: the sessions of an account are read from its record
(`GET /admin/users/{userId}/sessions`) and an administrator can sign one or every session out
after a confirmation (`DELETE /admin/users/{userId}/sessions[/{sessionId}]`).

## Independent administration panels — MAIR-406

Users, roles and groups retain their existing forms and confirmations; sessions retain their lists,
errors and readback behavior. Each panel is a stable top-level component in
`src/components/administration/`; the console keeps shared orchestration.
The common controls and confirmation dialog do not access administration data.
Refreshing the console preserves the current panel's unsaved draft or selected
session-history view; switching tabs retains the existing mount/unmount behavior.
This design slice is tracked by issue #146. It does not certify token-based
session commands, deployed permissions, real authentication or main integration.

## Reopening a protected page after a data redirect — MAIR-406

When a data fetch returns an opaque redirect, reopen the current protected page
once and let its existing middleware navigate to Login with that page's return
path and query. Do not keep treating this as a generic service failure, infer a
destination from a network error, or replay a write. Ordinary 401/403/503 failures
and aborted requests retain their distinct behavior. The disposable local QA
Login landing is not real authentication; no API/BFF or auth policy is changed.

## Console visibility from the resolved profile — MAIR-406

The existing session hook must finish successfully with an Admin profile before
the page mounts its console and starts administration reads. Pending profiles
show a status, while Responsable, Maire, User and Guest profiles retain the shell
but see an access-reserved message with no administration tables or actions.
Profile failure is a distinct unavailable state with a document-reload retry;
the existing 401 logout path is preserved. The old prototype's README reserves
Administration, although its actual page also mounted the console unconditionally.
Do not copy that defect or treat this presentation gate as server authorization.
Token session commands and other mixed-audit criteria remain separate; redirect
recovery is qualified above, not claimed integrated. No API/BFF, authentication
helper, contract or product fixture changes.

## Data-request session ownership — MAIR-406

Legacy browser JWT storage no longer overrides the cookie used by the existing
frontend proxy. Data requests do not read, migrate or erase that storage; explicit
caller headers and existing logout cleanup remain unchanged. This is a client
correction, not proof of administrator authorization, server-side revocation or
an identifier-based replacement for the existing token session commands. Those
other audit subjects remain open. No API/BFF or demonstration data changes.

## Active-module navigation

The measured reference sidebar rhythm is restored by this front's consumer CSS
(MAIR-180 / issue141): 44px minimum navigation targets and the reference shadow.
Mobile sidebar stacking leaves the published Close button above it; click,
keyboard navigation and Escape must retain opener focus. The existing red
Administration marker and permission-based visibility are unchanged. Paired
desktop/mobile checks cover users search/detail, roles, group detail/members and
sessions/history without writing real data. Fixtures do not certify deployed
authorization, password reset, revocation or durable persistence. The old fake
footer version and reference-only preferences/notifications are not copied.

The shared `AppShell` now owns desktop and mobile navigation. It shows only
configured active destinations, omits the archived E-mails and Files modules,
and preserves administrator visibility and Settings. Attachments and business
documents inside active modules are not removed.

## One account destination

Profile access opens **Settings**. No local profile page remains; authenticated
`/profile` bookmarks and subpaths redirect from the frontend middleware to the
configured Settings frontend. If Settings is not configured correctly, the
middleware returns an uncached unavailable state. No demo identity or simulated
save is shown.

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Host the Mairie360 administration interface: navigation, session context and the shared administration component. The service exposes BFF User routes at the same origin as the interface.

## Audience and value

Account and permission administrators.

Business domain: Identity and administration.

## Available capabilities

- BFF-backed administration console rendered inside the shared `AppShell`.
- Typed client for users, roles, groups, membership and sessions.
- Session rows distinguish active, expired and revoked states using the published
  expiry/revocation fields; an unusable expiry is explicitly unknown. One local
  timer updates labels at expiry without fetching extra data or altering counts.
- Local confirmations focus Cancel, contain keyboard navigation, and restore the
  connected trigger on cancellation. Pending actions retain their existing lock
  against duplicate submission and cancellation; no server permission changes.
- Session-based module navigation, profile access and logout.

### Responsive console panels (MAIR-372)

The default root scale is 17px and the body uses the system sans-serif font,
matching the preserved local reference (MAIR-180). The body selector keeps that
font even if the shared stylesheet loads later in a production build. Standard
small-text tokens stay unchanged; the shared header reaches 68px through its
existing rem sizing, without a fixed-height override or a new appearance setting.

Console cards keep the local reference shadow. Long names wrap within the
available space, including the selected group's heading, without increasing
the page width. Panel actions and group identifiers do not shrink or break
within a word. Wide data tables still scroll inside their own container.
This is a frontend presentation change only: data, permissions and contract
operations are unchanged. Responsive acceptance is checked in a browser at
390px, 768px and 1280px; HTML tests alone do not prove layout fidelity.

The users table's visually hidden action-column label is positioned relative to
its header cell, so its accessible text cannot escape the table's scroll area
and widen the document on mobile. The full table and accessible label remain;
the page does not hide horizontal overflow to mask the problem.

### Group save confirmation (MAIR-440)

The console rejects concurrent actions synchronously. Group fields, selection,
console tabs and refresh controls are locked until the active write and its
reload finish. A refused save retains the draft for an explicit retry. A confirmed
creation clears only its submitted form; a confirmed edit applies the returned
group. A failed reload is reported separately from the successful mutation, with
a read-only retry: never repeat a confirmed write. Out-of-order detail responses
cannot replace the most recently selected group. These are frontend guarantees,
not proof of deployed permissions, credential changes or permanent deletion.

### User and role editor integrity (MAIR-441)

User and role fields and commands are locked through active writes and reloads.
User row selection is also blocked for mouse and keyboard, so a late save cannot
mix one person's selected record with another person's form. Refused saves retain
drafts for an explicit retry. Editing profile fields alone preserves every existing
role: role replacement is sent only when its selection changes. Opening a role
retains its published `can_be_deleted` value, including false, null or absence;
it does not silently enable deletion. These frontend protections do not certify
credential operations, permanent deletion, deployed authorization or atomicity
across an explicitly requested multi-operation role replacement.

### Latest user-list read (MAIR-448)

The most recently submitted user search, page navigation or repeated search
refresh owns rows, total, pagination, errors and loading. Earlier responses are
ignored, including failures; leaving the panel invalidates pending reads.
A fresh retry still uses the existing BFF operation. This is a React-state
guarantee only: network clients, contracts, permissions and write locks are
unchanged. Deferred HTTP tests cover success/failure ordering, pagination,
retries and reopening the panel; copied-state browser recipes do not certify
deployed authorization or persistence.

## Typical workflow

1. Open the interface with a session holding the required permissions.
2. Inspect administration functions available in the shared component.
3. Perform operations supported by the contract and inspect server responses.

## Role within Mairie360

Associated repositories: [BFF_user](https://github.com/mairie360/BFF_user).

This repository contains the browser interface and its Next.js adapters. The associated BFF supplies business data and coordinates its sources.

## Data and current state

Core supplies identity and session operations. The BFF SQL repositories also read users and roles and perform some password and group mutations. The first-sign-in flow uses PostgreSQL and Redis. Data access is therefore a mixture of HTTP and direct database operations.

## Scope and limitations

Monitoring, backups, application logs and system policy described in administration requirements are not guaranteed by this contract. SQL access requires a compatible schema, including `group_members`; this name differs from `group_users` used in other contracts.

`src/app/page.tsx` mounts the local `AdministrationConsole`, which uses the typed
client in `src/lib/administration-api.ts`, inside `@mairie360/lib-components`’
`AppShell`. The shared package supplies navigation and layout, not business data.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.


## Shared visual direction — MAIR-547

Approved light option 1: shared tokens and font, accessible navigation, and preserved business layouts. See the [visual QA](../qa/design-qa.md) for evidence, checks, and RGAA limitations.
