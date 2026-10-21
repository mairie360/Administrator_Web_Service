# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "60a173a4e69bd76c65a638e7e392dec4094643f0", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 09:46 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `60a173a` | 2026-10-21 09:46 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- Les workflows `cicd.yml` et `contracts.yml` ne se lancent plus sur push que pour `main` ; les PR gardent leur déclencheur, donc une branche de PR ne lance plus son pipeline deux fois, et le jeton est en lecture seule par défaut (seul le job appelant la release garde `contents`, `packages` et `id-token` en écriture). (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Un push sur `main` ne déclenche plus que la release dev : staging et prod se promeuvent à la main via `promote-staging.yml` et `promote-prod.yml` (`gh workflow run`, `-f sha=` optionnel), avec l'approbation des environnements `Staging` et `Prod`. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))
- Console d'administration : le thème municipal n'est plus porté par `src/app/municipal-theme.css` (supprimé) mais par les styles publiés de `@mairie360/lib-components` 0.9.0 ; les placeholders de chargement utilisent `Skeleton` ; un lien d'évitement unique précède la navigation répétée. Le diff étant tronqué, les autres écrans retouchés (groupes, rôles, sessions, utilisateurs) ne sont pas détaillés. (MAIR-526 dans la description, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- CICD passe de v4.2.1 à v4.4.3, en passant par v4.3.1, v4.3.2, v4.3.3, v4.4.0 et v4.4.1, toujours épinglé par SHA suivi de son tag ; `tests/cicd-pin.test.cjs` vérifie que les huit références concordent. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202), [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- Le journal des releases est rédigé par Claude : les secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` sont transmis au workflow réutilisable. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198))
- Le front n'utilise plus `@mairie360/front-kit` vendorisé : il importe les sous-chemins de `@mairie360/lib-components` 0.10.2, et `npm run test:bundle` vérifie le build client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- `@mairie360/bff-user-openapi` passe de `0.0.0-dev` à `1.0.0`, puis à `0.0.0-staging.b6b04cf…` ; les stacks de test passent aux images `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0, et `bff-user` aux tags correspondants. Le contrat OpenAPI lui-même ne change pas de route. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204) ; MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- `scripts/contract-version.mjs` accepte `0.0.0-staging.<sha40>` (image `staging-<sha7>`) et refuse le sha court. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- `braces` est vendorisé en devDependency (backport de développement, avec sa licence MIT et sa provenance). Les tests de bundle et de politiques CI sont ajoutés ou mis à jour. (MAIR-126, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196))
- `follow-redirects` passe en 1.16.1 dans le lockfile pour débloquer `npm audit`. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Un push sur `main` ne déclenche plus que la release dev : staging et prod ne se promeuvent plus automatiquement, il faut lancer `promote-staging.yml` à la main (`gh workflow run promote-staging.yml -R mairie360/Administrator_Web_Service`, `-f sha=` optionnel). Le staging refuse un commit sans `dev-<sha>` et sans run main vert. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

#### Technique
- CICD passe de v4.3.2 à v4.4.3 (versions 4.3.3, 4.4.0, 4.4.1 puis 4.4.3), toujours épinglé par SHA suivi de son tag ; les pins couvrent désormais les deux workflows de promotion. (MAIR-494, [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- Ajout de `promote-staging.yml` et `promote-prod.yml` (groupes de concurrence par cible, `renovate.json` et `tests/cicd-pin.test.cjs` mis à jour), plus `follow-redirects` 1.16.1 dans le lockfile pour `npm audit`. Aucun effet visible pour les agents ou le BFF. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- Les workflows `cicd.yml` et `contracts.yml` ne se lancent plus sur push que pour `main`, le jeton est en lecture seule par défaut et seul le job appelant la release garde les droits d'écriture. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Console d'administration : le thème municipal est désormais fourni par les styles publiés de `@mairie360/lib-components` 0.9.0 (`src/app/municipal-theme.css` supprimé), les placeholders de chargement utilisent `Skeleton`, et un lien d'évitement unique précède la navigation répétée. Le diff étant tronqué, les autres écrans retouchés ne sont pas détaillés. (MAIR-526 dans la description, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- `@mairie360/bff-user-openapi` passe de `0.0.0-dev` à `1.0.0` (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)), puis à `0.0.0-staging.b6b04cf…` avec les images de test `staging-b6b04cf` (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206)) ; le contrat lui-même n'a pas de route changée, seul `x-source-package` bouge. Les stacks de test passent à `core-api` 2.1.0 et à `database` et `liquibase-migrations` 3.2.0.
- Le front n'utilise plus `@mairie360/front-kit` vendorisé mais les sous-chemins de `@mairie360/lib-components` 0.10.2, avec un test de bundle client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Le journal des releases est rédigé par Claude : CICD passe à v4.3.1, puis v4.3.2, et le workflow reçoit `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK`. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))
- Release dev du 699a1ef : `@mairie360/bff-user-openapi` épinglé en dev et images de test alignées, remplacé ensuite par les versions staging et prod. (MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204))
- `braces` est vendorisé en devDependency, avec sa licence et sa provenance. (MAIR-126, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
