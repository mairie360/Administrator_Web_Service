# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "e719c5b1cc5d5c8b8b1745b2a0a7c916c19b354d", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-21 04:52 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `e719c5b` | 2026-10-21 04:52 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Administration : un lien d'évitement (skip link) précède désormais la navigation répétée, les chargements affichent des placeholders partagés (`Skeleton`), les résultats vides sont libellés et les confirmations s'affichent dans un reçu fermable, sans effacer les brouillons ni les erreurs contextuelles (d'après la description de la PR, le diff étant tronqué). (#194, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- La feuille `src/app/municipal-theme.css` est supprimée : l'apparence vient désormais des styles publiés de `@mairie360/lib-components` (`styles.css`), ce qui modifie le rendu de l'interface d'administration. (#194, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Front : l'archive vendorisée `@mairie360/front-kit` est remplacée par les sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement ; `npm run test:bundle` est ajouté au workflow de performance ; un `braces` de développement est vendorisé. (#194, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Contrat et stacks Docker : `@mairie360/bff-user-openapi` passe de `0.0.0-dev` à `1.0.0` (#196), puis au paquet `0.0.0-staging.b6b04cf…` (#204, #206) ; `contracts/openapi.json` ne change que son `x-source-package`, sans route ajoutée ou retirée. Les stacks de test utilisent `bff-user:staging-b6b04cf`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. ([#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI/CD : `mairie360/CICD` passe jusqu'à v4.4.1 ; le journal de release rédigé par Claude est alimenté par les secrets `ANTHROPIC_API_KEY` et `RELEASE_APP_*` ; le jeton du workflow est en lecture seule par défaut et le push sur `main` ne déclenche que les jobs utiles (MAIR-436) ; la promotion staging et prod est manuelle (MAIR-494). ([#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216))
- Sécurité : `follow-redirects` 1.16.1 dans le lockfile, pour débloquer `npm audit` (GHSA-q3jh-wrc6-jgq8, GHSA-8r9p-f939-6h3c). ([#213](https://github.com/mairie360/Administrator_Web_Service/pull/213))
- Tests : ajout de `cicd-pin.test.cjs`, `workflow-permissions.test.cjs` et `lib-runtime-package.test.cjs`. ([#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence dev → staging (en dev, pas encore en staging)

#### Technique
- CI/CD : `mairie360/CICD` passe de v4.3.3 à v4.4.0 (#214) puis v4.4.1 (#216). Un push sur `main` ne lance plus que la release dev ; staging et prod passent par les workflows manuels `promote-staging.yml` et `promote-prod.yml` (MAIR-494). Aucun effet sur l'application elle-même. ([#213](https://github.com/mairie360/Administrator_Web_Service/pull/213), [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214), [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216))
- Dépendances : mise à jour de la référence CICD dans `cicd.yml` et `dev-dependency-exception.yml` (v4.3.3, #209), et `follow-redirects` 1.16.1 dans le lockfile (#213).

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Administration : un lien d'évitement (skip link) précède désormais la navigation répétée, les chargements affichent des placeholders partagés (`Skeleton`), les résultats vides sont libellés et les confirmations s'affichent dans un reçu fermable, sans effacer les brouillons ni les erreurs contextuelles (d'après la description de la PR, le diff étant tronqué). (#194, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- La feuille `src/app/municipal-theme.css` est supprimée : l'apparence vient désormais des styles publiés de `@mairie360/lib-components` (`styles.css`), ce qui modifie le rendu de l'interface d'administration. (#194, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Front : l'archive vendorisée `@mairie360/front-kit` est remplacée par les sous-chemins de `@mairie360/lib-components` 0.10.2, sans changement de comportement annoncé. ([#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Contrat et stacks Docker : `@mairie360/bff-user-openapi` passe de `0.0.0-dev` à `1.0.0` (#196), puis au paquet `0.0.0-staging.b6b04cf…` (#204, #206) ; le contrat ne change que son `x-source-package`, sans route modifiée. Les stacks de test utilisent `bff-user:staging-b6b04cf`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. ([#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI/CD : `mairie360/CICD` passe à v4.3.1 (#198), v4.3.2 (#202) puis v4.3.3 (#209) ; le journal de release rédigé par Claude reçoit ses secrets, le jeton du workflow est en lecture seule par défaut (MAIR-436) et la promotion staging et prod est manuelle (#213). ([#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202), [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209))
- Tests : ajout de `workflow-permissions.test.cjs`, `cicd-pin.test.cjs` et `lib-runtime-package.test.cjs`. ([#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 04:52 UTC | dev | — | `e719c5b` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39546008317) |
| 2026-10-21 01:40 UTC | dev | — | `5356886` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39528080542) |
| 2026-10-20 19:07 UTC | staging | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 19:01 UTC | dev | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
