# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "8372ea18c9b3e1e583ece389ccedb8b1c25a48ba", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 10:46 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `8372ea1` | 2026-10-21 10:46 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Accusés de réception fermables après une action réussie dans la console d'administration (utilisateurs, groupes, rôles, sessions), et résultats vides libellés. D'après la description de la PR, le diff touche les panneaux correspondants. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Le thème visuel municipal est remplacé : `src/app/municipal-theme.css` est supprimé et la feuille publiée `@mairie360/lib-components/styles.css` (0.9.0) prend le relais. Les blocs de chargement de `loading.tsx` deviennent des `Skeleton`. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Un seul lien d'évitement précède la navigation répétée. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Une poussée sur `main` ne déclenche plus la promotion en staging ni en prod : `promote-staging.yml` et `promote-prod.yml` sont manuels (`workflow_dispatch`, `sha` optionnel), avec approbation des environnements `Staging` / `Prod`. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))
- `cicd.yml` et `contracts.yml` ne tournent sur push que sur `main`, les branches de PR étant couvertes par `pull_request`. Le token du workflow est en lecture seule par défaut ; seul le job `CICD` reçoit les droits d'écriture. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))

#### Technique
- Pin de `mairie360/CICD` remonté de v4.2.1 à v4.4.3, avec secrets de journal de release (`ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`) transmis par `cicd.yml`. (MAIR-571 / MAIR-494, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219), [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209))
- Contrat `@mairie360/bff-user-openapi` passé de 1.0.0 (ae443ce) à un paquet dev (a266ffd), puis à `0.0.0-staging.b6b04cf…` (078db63). Le contenu de `contracts/openapi.json` ne change que par sa ligne `x-source-package` ; aucune route n'est modifiée dans le diff. ([#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- Stacks `docker-compose*.yml` : `core-api` 2.1.0 puis 2.2.0, `database` et `liquibase-migrations` 3.2.0 puis 3.3.0 (le diff ne montre pas le contenu des migrations), `bff-user` en 1.0.0, puis `dev-699a1ef`, puis `staging-b6b04cf`. ([#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220), [#221](https://github.com/mairie360/Administrator_Web_Service/pull/221))
- `@mairie360/front-kit` remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 (`next`, `guard`, `browser`, `shared`, `react`, `theme`) ; archive `vendor/…tgz` supprimée ; ajout de `npm run test:bundle` au workflow de performance. Pas de changement de comportement annoncé. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- `braces` backporté dans `vendor/braces` (dev uniquement, avec sa licence et ses tests), et lib-components 0.8.0 → 0.9.0 pour l'UI. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Tests et documentation : `tests/cicd-pin.test.cjs`, `tests/workflow-permissions.test.cjs`, `CLAUDE.md` et docs EN/FR mis à jour.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Une poussée sur `main` ne libère plus que dev : `cicd.yml` s'arrête à `release-dev`. La promotion vers staging est manuelle via `promote-staging.yml` (`gh workflow run promote-staging.yml`, `-f sha=` optionnel). (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

#### Technique
- Stacks `docker-compose*.yml` : `core-api` passe de 2.1.0 à 2.2.0, et `database` ainsi que `liquibase-migrations` de 3.2.0 à 3.3.0 (le diff ne montre pas le contenu du schéma). ([#220](https://github.com/mairie360/Administrator_Web_Service/pull/220), [#221](https://github.com/mairie360/Administrator_Web_Service/pull/221))
- `mairie360/CICD` épinglé de v4.3.3 à v4.4.0 (caa28f4), puis v4.4.1 (e719c5b), puis v4.4.3 (60a173a), sur `cicd.yml`, `dev-dependency-exception.yml` et les deux nouveaux workflows de promotion. ([#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- Mise à jour de `mairie360/CICD` de v4.3.2 à v4.3.3 (a627e9c), et ajout de `tests/cicd-pin.test.cjs` vérifiant la cohérence des épingles, couvrant désormais huit références. ([#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

## Différence staging → prod (en staging, pas encore en prod)

#### Technique
- Contrat `@mairie360/bff-user-openapi` pointé sur `0.0.0-staging.b6b04cf…` et image `bff-user` sur `staging-b6b04cf` (même digest que `dev-b6b04cf`) ; `scripts/contract-version.mjs` accepte désormais les paquets staging. Le contrat est inchangé (même commit du BFF). ([#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- Contrat pointé sur le paquet dev `0.0.0-dev.699a1ef…` et image `bff-user:dev-699a1ef` (MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204)).
- `mairie360/CICD` passé à v4.3.2 puis v4.3.1 et v4.3.3 à v4.4.x ; secrets de journal de release transmis (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202)). Le journal de release est écrit par CICD sur `main` ; sans effet sur l'application.
- `@mairie360/front-kit` remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2 ; archive `vendor/…tgz` supprimée ; `npm run test:bundle` ajouté au workflow de performance (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200)).
- Permissions des workflows CI réduites (lecture seule par défaut, écriture uniquement pour le job `CICD`), `Node 24.21.0` dans la documentation et `tests/workflow-permissions.test.cjs` (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191)).
- Contrat `@mairie360/bff-user-openapi` passé à la version 1.0.0 et images compose alignées : `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0 (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)).
- `braces` backporté dans `vendor/braces` (dev uniquement), et lib-components 0.8.0 → 0.9.0 (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194)).

#### Changements de comportement
- Thème municipal : `src/app/municipal-theme.css` supprimé, remplacé par la feuille publiée de lib-components 0.9.0 ; les blocs de chargement deviennent des `Skeleton`. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Accusés de réception fermables après action et résultats vides libellés dans la console d'administration, d'après la description de la PR. (35e16dd, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 10:46 UTC | dev | — | `8372ea1` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39584836222) |
| 2026-10-21 09:47 UTC | dev | — | `8f86eab` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39578421933) |
| 2026-10-21 09:46 UTC | dev | — | `60a173a` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39578372263) |
| 2026-10-21 04:52 UTC | dev | — | `e719c5b` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39546008317) |
| 2026-10-21 01:40 UTC | dev | — | `5356886` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39528080542) |
| 2026-10-20 19:07 UTC | staging | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 19:01 UTC | dev | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
