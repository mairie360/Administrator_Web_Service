# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "a758fd0f60e38b31739b2314b21ad7ced4969a26", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "3b39b493511c215d1fc91f42d280b37853a14173", "updated": {"dev": "2026-10-20 12:22 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `3b39b49` | — |
| dev | — | `a758fd0` | 2026-10-20 12:22 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- L'interface d'administration utilise désormais le thème commun publié par `@mairie360/lib-components` 0.9.0, chargé via `@mairie360/lib-components/styles.css`. La copie locale `municipal-theme.css` est supprimée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- L'écran de chargement « Chargement du profil et de la console… » affiche les placeholders `Skeleton` de la bibliothèque partagée à la place des blocs animés locaux. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- D'après la PR, dont le diff est tronqué, les panneaux d'administration (utilisateurs, groupes, rôles, sessions) affichent des résultats vides libellés et des confirmations d'action refermables. Un lien d'évitement unique précède la navigation répétée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances et socle front :
  - Le socle partagé (session, proxy, garde, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2. Il remplace l'archive vendue `@mairie360/front-kit`, sans changement de comportement. Un nouveau contrôle `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le contrat `@mairie360/bff-user-openapi` passe en 1.0.0, et les stacks `docker-compose*.yml` utilisent les images prod : `bff-user` 1.0.0, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196))
  - Un backport `braces` est ajouté, réservé au développement. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI/CD (3 commits) :
  - Le jeton est en lecture seule par défaut et les workflows ne se lancent sur push que pour `main`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - `mairie360/CICD` passe en v4.3.1 puis v4.3.2, avec les secrets du journal des releases et un épinglage suivi par Renovate. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'interface d'administration utilise désormais le thème commun publié par `@mairie360/lib-components` 0.9.0, chargé via `@mairie360/lib-components/styles.css`. La copie locale `municipal-theme.css` est supprimée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- L'écran de chargement « Chargement du profil et de la console… » affiche les placeholders `Skeleton` de la bibliothèque partagée à la place des blocs animés locaux. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- D'après la PR, dont le diff est tronqué, les panneaux d'administration (utilisateurs, groupes, rôles, sessions) affichent des résultats vides libellés et des confirmations d'action refermables. Un lien d'évitement unique précède la navigation répétée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances et socle front :
  - Le socle partagé (session, proxy, garde, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components` 0.10.2. Il remplace l'archive vendue `@mairie360/front-kit`, sans changement de comportement. Un nouveau contrôle `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le contrat `@mairie360/bff-user-openapi` passe en 1.0.0, et les stacks `docker-compose*.yml` utilisent les images prod : `bff-user` 1.0.0, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196))
  - Un backport `braces` est ajouté, réservé au développement. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI/CD (3 commits) :
  - Le jeton est en lecture seule par défaut et les workflows ne se lancent sur push que pour `main`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - `mairie360/CICD` passe en v4.3.1 puis v4.3.2, avec les secrets du journal des releases et un épinglage suivi par Renovate. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
