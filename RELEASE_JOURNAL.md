# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "8f86eab7317131f9cd39e45af02757fcd9364e1d", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 09:47 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `8f86eab` | 2026-10-21 09:47 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Lien d’évitement (skip link) placé avant la navigation répétée, résultats vides étiquetés et reçus d’action fermables dans la console d’administration. (#194, https://github.com/mairie360/Administrator_Web_Service/pull/194)

#### Changements de comportement
- Thème : l’interface utilise désormais le thème de `@mairie360/lib-components` (`styles.css`) ; `src/app/municipal-theme.css` est supprimé. Les placeholders de chargement de `loading.tsx` sont des `Skeleton`. (#194, https://github.com/mairie360/Administrator_Web_Service/pull/194)
- Pipeline : un push sur `main` ne lance plus que `release-dev`. Staging et prod se promeuvent à la main avec `promote-staging.yml` et `promote-prod.yml` (`gh workflow run`, option `-f sha=`). (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))

#### Technique
- Versions des contrats `@mairie360/bff-user-openapi` et des images des stacks de test (`core-api`, `database`, `liquibase-migrations`, `bff-user`) modifiées à plusieurs reprises. (MAIR-569, MAIR-575, MAIR-600, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206), [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220))
- Migration de `@mairie360/front-kit` vers les sous-chemins de `@mairie360/lib-components` ; test `npm run test:bundle` ajouté au workflow de performance. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- `mairie360/CICD` mis à jour de v4.2.1 jusqu’à v4.4.3 ; secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow pour le journal des releases. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202), [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- CI durcie : triggers `push` limités à `main`, token en lecture seule par défaut, droits d’écriture pour le seul job CICD, test `tests/workflow-permissions.test.cjs`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Dépendances : `follow-redirects` 1.16.1 dans le lockfile, backport `braces` en `vendor/` (dev uniquement). (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213), [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Stacks de test : `ghcr.io/mairie360/core-api` passe à `2.2.0` dans les trois `docker-compose*.yml`. (Renovate, [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220))
- `mairie360/CICD` mis à jour en v4.3.3, v4.4.0, v4.4.1 puis v4.4.3 (mises à jour Renovate, [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219)).
- Promotion séparée (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213)) : `promote-staging.yml` et `promote-prod.yml` ajoutés, `cicd.yml` s’arrête à `release-dev` sur `main`, `follow-redirects` 1.16.1 dans le lockfile. Aucun changement fonctionnel côté service.

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Lien d’évitement (skip link) placé avant la navigation répétée, résultats vides étiquetés et reçus d’action fermables dans la console d’administration. (#194, https://github.com/mairie360/Administrator_Web_Service/pull/194)

#### Changements de comportement
- Thème : l’interface utilise désormais le thème de `@mairie360/lib-components` (`styles.css`) ; `src/app/municipal-theme.css` est supprimé. Les placeholders de chargement de `loading.tsx` sont des `Skeleton`. (#194, https://github.com/mairie360/Administrator_Web_Service/pull/194)

#### Technique
- Contrat BFF User : `@mairie360/bff-user-openapi` épinglé au paquet `0.0.0-staging.b6b04cf…`, image `bff-user` `staging-b6b04cf` dans les stacks ; contrat inchangé. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- Versions des contrats et des images de stacks de test modifiées (MAIR-575, MAIR-569, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)).
- Migration de `@mairie360/front-kit` vers les sous-chemins de `@mairie360/lib-components` ; test `npm run test:bundle` ajouté. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- `mairie360/CICD` en v4.3.1 puis v4.3.2 ; secrets du journal des releases transmis ; `RELEASE_JOURNAL.md` rédigé par Claude sur `main`. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))
- CI durcie : triggers `push` limités à `main`, token en lecture seule par défaut, test `tests/workflow-permissions.test.cjs`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Promotion manuelle staging et prod et `follow-redirects` 1.16.1 (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213)) ; backport `braces` en `vendor/` (dev uniquement, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
