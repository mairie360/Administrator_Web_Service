# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 10:50 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `bea8f87` | 2026-10-21 10:50 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Le front adopte le socle UI partagé `@mairie360/lib-components` 0.9.0 : le thème commun vient de la feuille de style publiée (`municipal-theme.css` supprimé du front), les squelettes de chargement sont partagés, le lien d'évitement unique précède la navigation répétée, les états vides sont libellés et les confirmations d'action sont fermables. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Les panneaux de l'administration (utilisateurs, groupes, rôles, sessions) et le shell sont adaptés au socle partagé ; d'après la description de la PR, les brouillons, les erreurs contextuelles et la reprise en lecture seule sont conservés. (MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Migration `@mairie360/front-kit` vers `@mairie360/lib-components` 0.10.2 : imports en sous-chemins (`next`, `guard`, `browser`, `shared`, `react`, `theme`), archive `vendor/mairie360-front-kit-0.1.0.tgz` supprimée, `npm run test:bundle` ajouté au workflow de performance ; aucun changement de comportement annoncé. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Pins de contrat et d'images de test : `@mairie360/bff-user-openapi` passe de la version dev à `1.0.0` (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196)), puis à une pré-version staging (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206)), puis à `1.1.0` (MAIR-612, [#222](https://github.com/mairie360/Administrator_Web_Service/pull/222)) ; le contrat exporté ne change que sa source. Les stacks `docker-compose*.yml` suivent (`core-api`, `database`, `liquibase-migrations`, `bff-user`).
- Pins mairie360/CICD successifs (v4.3.1 à v4.4.3) et workflows `promote-staging.yml` / `promote-prod.yml` ajoutés (MAIR-494, MAIR-571, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198)).
- CI : `cicd.yml` et `contracts.yml` ne se lancent sur push que pour `main`, token en lecture seule par défaut, écriture réservée au job de release (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191)).
- Journal des releases rédigé par Claude : secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow réutilisable (MAIR-571, [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202)).

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- Test stacks : `core-api` passe en `2.2.0`, `database` et `liquibase-migrations` en `3.3.0` (Renovate, [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220), [#221](https://github.com/mairie360/Administrator_Web_Service/pull/221)).
- Pin de contrat : `@mairie360/bff-user-openapi` passe à `1.1.0` et l'image `bff-user` des stacks de test suit (MAIR-612, [#222](https://github.com/mairie360/Administrator_Web_Service/pull/222)) ; le contrat exporté ne change que sa source.
- Workflows CI : mairie360/CICD passe successivement en v4.3.3, v4.4.0, v4.4.1 puis v4.4.3 (Renovate, [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216), [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219)).
- Promotion manuelle : `promote-staging.yml` et `promote-prod.yml` ajoutés, sur `main` uniquement, avec un verrou par cible, et test `cicd-pin` qui couvre les huit références CICD (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213)) ; d'après la description, `follow-redirects` est aussi mis à jour dans le lockfile.

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Le front adopte le socle UI partagé `@mairie360/lib-components` 0.9.0 : le thème commun vient de la feuille de style publiée (`municipal-theme.css` supprimé du front), les squelettes de chargement sont partagés, le lien d'évitement unique précède la navigation répétée, les états vides sont libellés et les confirmations d'action sont fermables. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Les panneaux de l'administration (utilisateurs, groupes, rôles, sessions) et le shell sont adaptés au socle partagé ; d'après la description de la PR, les brouillons, les erreurs contextuelles et la reprise en lecture seule sont conservés. (MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Migration `@mairie360/front-kit` vers `@mairie360/lib-components` 0.10.2 : imports en sous-chemins, archive `vendor/mairie360-front-kit-0.1.0.tgz` supprimée, `npm run test:bundle` ajouté au workflow de performance ; aucun changement de comportement annoncé. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Pins de contrat et d'images de test : `@mairie360/bff-user-openapi` passe de la version dev à `1.0.0` puis à une pré-version staging (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204) ; MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206)) ; le contrat exporté ne change que sa source.
- CI : `cicd.yml` et `contracts.yml` ne se lancent sur push que pour `main`, token en lecture seule par défaut (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191)) ; mairie360/CICD passe en v4.3.1 puis v4.3.2 (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202)).
- Journal des releases : secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID` et `RELEASE_APP_PK` transmis au workflow réutilisable (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198)).

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 10:50 UTC | dev | — | `bea8f87` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39586175877) |
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
