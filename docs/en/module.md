# Administrator_Web_Service — Module overview

[Technical documentation](technical.md) · [Français](../fr/module.md) · [README](../../README.md)

Host the Mairie360 administration interface: navigation, session context and the shared administration component. The service exposes BFF User routes at the same origin as the interface.

## Audience and value

Account and permission administrators.

Business domain: Identity and administration.

## Available capabilities

- Administration interface supplied by the shared library’s `AdministrationModule`.
- Typed client for users, roles, groups, membership and sessions.
- Session-based module navigation, profile access and logout.

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

`src/app/page.tsx` mounts `AdministrationModule` without repository-specific data callbacks. Detailed component behavior therefore depends on the version of `@mairie360/lib-components`. `src/lib/administration-api.ts` supplies a typed local client, but its presence does not prove that every shared-component screen uses it.

## Developing or operating this module

The [technical guide](technical.md) covers architecture, configuration, routes, session handling, persistence, tests and CI/CD. It describes sources of truth and contract synchronization with associated repositories.
