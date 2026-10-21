# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "5356886703ea6a93c223561b2ffe9e5f7e725dc0", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 01:40 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `5356886` | 2026-10-21 01:40 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Les états de chargement de la console d'administration utilisent des placeholders partagés (`Skeleton` de `@mairie360/lib-components`), les résultats vides sont libellés et les accusés de confirmation sont fermables sans effacer les brouillons en cours. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Le thème de la console d'administration vient désormais de la feuille de style publiée de `@mairie360/lib-components` 0.9.0 : `src/app/municipal-theme.css` est supprimé, et le lien d'évitement (skip link) est le seul placé avant la navigation répétée. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Les fronts importent le socle partagé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de `@mairie360/front-kit` (archive `vendor/` supprimée) ; un test de bundle client est ajouté au workflow de performance. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- CI : `mairie360/CICD` passe de v4.2.1 à v4.3.1 puis v4.3.2 (journal des releases, secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK` transmis), avec épinglage SHA et tests de cohérence (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202)).
- CI : `cicd.yml` et `contracts.yml` ne se déclenchent sur push que pour `main`, avec un token en lecture seule par défaut et les droits d'écriture réservés au job de release (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191)).
- Contrat BFF : `@mairie360/bff-user-openapi` est épinglé à 1.0.0 (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)) puis au paquet `0.0.0-staging.b6b04cf…` (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206)) ; `contracts/openapi.json` et les stacks `docker-compose*.yml` suivent ces versions (images `bff-user` staging-b6b04cf, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0).
- CI : `mairie360/CICD` est passé à v4.4.0 (promotion staging et prod séparée, workflows `promote-staging.yml` et `promote-prod.yml`) et `follow-redirects` 1.16.1 est dans le lockfile pour débloquer `npm audit` (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214)).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- `cicd.yml` passe à mairie360/CICD v4.4.0 : un push sur `main` s'arrête désormais à `release-dev`, sans runs en attente sur `Staging` / `Prod`. Ajout de `promote-staging.yml` et `promote-prod.yml`, déclenchés manuellement (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213)).
- Renovate met à jour mairie360/CICD v4.3.3 vers v4.4.0 dans `cicd.yml` et `dev-dependency-exception.yml` (MAIR-494, [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214)).
- Renovate met à jour mairie360/CICD v4.3.2 vers v4.3.3 dans `cicd.yml` et `dev-dependency-exception.yml` (dépendance CI, [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209)).

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Les états de chargement de la console d'administration utilisent des placeholders partagés (`Skeleton` de `@mairie360/lib-components`), les résultats vides sont libellés et les accusés de confirmation sont fermables sans effacer les brouillons en cours. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Le thème de la console d'administration vient désormais de la feuille de style publiée de `@mairie360/lib-components` 0.9.0 : `src/app/municipal-theme.css` est supprimé, et le lien d'évitement (skip link) est le seul placé avant la navigation répétée. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Les fronts importent le socle partagé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2 au lieu de `@mairie360/front-kit` (archive `vendor/` supprimée) ; un test de bundle client est ajouté au workflow de performance. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Contrat BFF : `@mairie360/bff-user-openapi` est épinglé à 1.0.0 (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)) puis au paquet `0.0.0-staging.b6b04cf…` (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206)) ; les stacks `docker-compose*.yml` suivent (images `bff-user` staging-b6b04cf, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0).
- CI : `mairie360/CICD` passe de v4.2.1 à v4.3.2 puis v4.3.3 (journal des releases, secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK` transmis), avec épinglage SHA et tests de cohérence (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202), [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209)).
- CI : `cicd.yml` et `contracts.yml` ne se déclenchent sur push que pour `main`, avec un token en lecture seule par défaut et les droits d'écriture réservés au job de release (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 01:40 UTC | dev | — | `5356886` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39528080542) |
| 2026-10-20 19:07 UTC | staging | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 19:01 UTC | dev | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
