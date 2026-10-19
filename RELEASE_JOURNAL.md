# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "826f3145214c500e042d8e7c9382e824ca13cf97", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "3b39b493511c215d1fc91f42d280b37853a14173", "updated": {"dev": "2026-10-19 20:14 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `3b39b49` | — |
| dev | — | `826f314` | 2026-10-19 20:14 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- L'interface d'administration utilise désormais le thème commun de `@mairie360/lib-components` 0.9.0 (feuille `@mairie360/lib-components/styles.css`) à la place de la copie locale `municipal-theme.css`, qui est supprimée. L'apparence peut donc changer en mode clair comme en mode sombre. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Pendant le chargement du profil et de la console, l'écran « Administration » affiche les blocs `Skeleton` partagés au lieu des anciens blocs animés locaux. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- D'après la PR, dont le diff est tronqué, les panneaux utilisateurs, groupes, rôles et sessions reprennent les composants partagés : résultats vides libellés, confirmations d'action refermables, et lien d'évitement unique placé avant la navigation. Les brouillons, les erreurs contextuelles et la reprise en lecture seule seraient conservés. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Contrat `@mairie360/bff-user-openapi` passé de `0.0.0-dev.46a698b…` à `1.0.0`, sans changement de routes. Les images des stacks `docker-compose*.yml` passent en versions prod : `bff-user:1.0.0`, `core-api:2.1.0`, `database:3.2.0`, `liquibase-migrations:3.2.0`. Ajout d'un backport `braces` vendorisé, réservé au développement. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI en deux changements. D'une part, jeton en lecture seule par défaut, droits d'écriture limités au job `CICD` et `push` déclenché sur `main` uniquement, avec de nouveaux tests `tests/workflow-permissions.test.cjs`. D'autre part, workflow CICD passé en v4.3.1 avec l'étape de journal de release (secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`). (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191) ; MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'interface d'administration utilise désormais le thème commun de `@mairie360/lib-components` 0.9.0 (feuille `@mairie360/lib-components/styles.css`) à la place de la copie locale `municipal-theme.css`, qui est supprimée. L'apparence peut donc changer en mode clair comme en mode sombre. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Pendant le chargement du profil et de la console, l'écran « Administration » affiche les blocs `Skeleton` partagés au lieu des anciens blocs animés locaux. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- D'après la PR, dont le diff est tronqué, les panneaux utilisateurs, groupes, rôles et sessions reprennent les composants partagés : résultats vides libellés, confirmations d'action refermables, et lien d'évitement unique placé avant la navigation. Les brouillons, les erreurs contextuelles et la reprise en lecture seule seraient conservés. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Contrat `@mairie360/bff-user-openapi` passé de `0.0.0-dev.46a698b…` à `1.0.0`, sans changement de routes. Les images des stacks `docker-compose*.yml` passent en versions prod : `bff-user:1.0.0`, `core-api:2.1.0`, `database:3.2.0`, `liquibase-migrations:3.2.0`. Ajout d'un backport `braces` vendorisé, réservé au développement. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI en deux changements. D'une part, jeton en lecture seule par défaut, droits d'écriture limités au job `CICD` et `push` déclenché sur `main` uniquement, avec de nouveaux tests `tests/workflow-permissions.test.cjs`. D'autre part, workflow CICD passé en v4.3.1 avec l'étape de journal de release (secrets `ANTHROPIC_API_KEY`, `RELEASE_APP_ID`, `RELEASE_APP_PK`). (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191) ; MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
