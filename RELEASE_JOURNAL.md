# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "a266ffde363d866f9b33543012a5d83b922c7828", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "3b39b493511c215d1fc91f42d280b37853a14173", "updated": {"dev": "2026-10-20 13:42 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `3b39b49` | — |
| dev | — | `a266ffd` | 2026-10-20 13:42 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- La console d'administration passe au thème commun de `@mairie360/lib-components` (feuille `@mairie360/lib-components/styles.css`) : la copie locale `municipal-theme.css` est supprimée, couleurs, typographie, navigation et pied de page viennent désormais de la lib partagée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Pendant le chargement de la page, « Chargement du profil et de la console… » s'affiche désormais avec les blocs `Skeleton` de la lib. Selon la PR, les panneaux (utilisateurs, groupes, rôles, sessions) utilisent aussi des états vides libellés et des confirmations d'action que l'on peut fermer, et le lien d'évitement unique précède la navigation ; les brouillons et messages d'erreur contextuels sont conservés (diff tronqué). (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances : `@mairie360/lib-components` passe de 0.8.0 à 0.10.2 et remplace l'archive `@mairie360/front-kit` du dossier `vendor/`, sans changement de comportement annoncé. `@mairie360/bff-user-openapi` passe à 1.0.0 puis au build `0.0.0-dev.699a1ef…`, sans changement de route visible dans le contrat. Les images des stacks de test sont mises à jour (`bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0). Un rétroportage dev de `braces` est ajouté. (MAIR-126, MAIR-569, MAIR-575, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI : jeton en lecture seule par défaut, avec droits d'écriture réservés au job `CICD`. Pipelines déclenchés sur `push` vers `main` seulement. CICD passe en v4.3.1 puis v4.3.2 (journal des releases, secrets `ANTHROPIC_API_KEY` / `RELEASE_APP_ID` / `RELEASE_APP_PK`), avec suivi Renovate des épinglages par SHA. Ajout d'un test du bundle client et de tests de politique. (MAIR-436, MAIR-571, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La console d'administration passe au thème commun de `@mairie360/lib-components` (feuille `@mairie360/lib-components/styles.css`) : la copie locale `municipal-theme.css` est supprimée, couleurs, typographie, navigation et pied de page viennent désormais de la lib partagée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Pendant le chargement de la page, « Chargement du profil et de la console… » s'affiche désormais avec les blocs `Skeleton` de la lib. Selon la PR, les panneaux (utilisateurs, groupes, rôles, sessions) utilisent aussi des états vides libellés et des confirmations d'action que l'on peut fermer, et le lien d'évitement unique précède la navigation ; les brouillons et messages d'erreur contextuels sont conservés (diff tronqué). (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances : `@mairie360/lib-components` passe de 0.8.0 à 0.10.2 et remplace l'archive `@mairie360/front-kit` du dossier `vendor/`, sans changement de comportement annoncé. `@mairie360/bff-user-openapi` passe à 1.0.0 puis au build `0.0.0-dev.699a1ef…`, sans changement de route visible dans le contrat. Les images des stacks de test sont mises à jour (`bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0). Un rétroportage dev de `braces` est ajouté. (MAIR-126, MAIR-569, MAIR-575, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI : jeton en lecture seule par défaut, avec droits d'écriture réservés au job `CICD`. Pipelines déclenchés sur `push` vers `main` seulement. CICD passe en v4.3.1 puis v4.3.2 (journal des releases, secrets `ANTHROPIC_API_KEY` / `RELEASE_APP_ID` / `RELEASE_APP_PK`), avec suivi Renovate des épinglages par SHA. Ajout d'un test du bundle client et de tests de politique. (MAIR-436, MAIR-571, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
