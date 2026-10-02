# Administrator_Web_Service — Module overview

## Active-module navigation

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

Console cards keep the local reference shadow. Long names wrap within the
available space, including the selected group's heading, without increasing
the page width. Panel actions and group identifiers do not shrink or break
within a word. Wide data tables still scroll inside their own container.
This is a frontend presentation change only: data, permissions and contract
operations are unchanged. Responsive acceptance is checked in a browser at
390px, 768px and 1280px; HTML tests alone do not prove layout fidelity.

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
