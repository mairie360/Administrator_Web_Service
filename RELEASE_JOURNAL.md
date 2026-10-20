# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "3b39b493511c215d1fc91f42d280b37853a14173", "updated": {"dev": "2026-10-20 19:01 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `3b39b49` | — |
| dev | — | `078db63` | 2026-10-20 19:01 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- La console d'administration adopte l'interface partagée de `@mairie360/lib-components` (0.9.0, puis 0.10.2) : le thème commun vient de la feuille de style publiée `@mairie360/lib-components/styles.css`, qui remplace la copie locale `municipal-theme.css`. L'écran de chargement « Chargement du profil et de la console… » affiche les `Skeleton` partagés. D'après la PR, les résultats vides sont désormais libellés et les confirmations d'action peuvent être refermées, sans perte des brouillons ni des messages d'échec contextuels (diff tronqué). (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Le lien d'évitement est désormais unique et placé avant la navigation répétée. (MAIR-526, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances et contrats, en 4 PR :
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) passe de l'archive `@mairie360/front-kit` aux sous-chemins de `@mairie360/lib-components@0.10.2`, sans changement de comportement, avec un contrôle `npm run test:bundle` du bundle client ;
  - `@mairie360/bff-user-openapi` passe de `0.0.0-dev.46a698b…` à `1.0.0`, puis `0.0.0-dev.699a1ef…`, puis `0.0.0-staging.b6b04cf…`, sans changement de contrat. La politique de version accepte désormais `0.0.0-staging.<sha40>` ;
  - les images des stacks de test sont alignées : `bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0.
  
  (MAIR-126, MAIR-569, MAIR-575, MAIR-600, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI/CD, en 3 PR :
  - jeton en lecture seule par défaut, droits d'écriture réservés au job de release ;
  - pipelines lancés sur push uniquement pour `main` ;
  - CICD passe en v4.3.1 puis v4.3.2 avec le journal des releases, et Renovate suit les épinglages SHA.
  
  (MAIR-436, MAIR-571, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La console d'administration adopte l'interface partagée de `@mairie360/lib-components` (0.9.0, puis 0.10.2) : le thème commun vient de la feuille de style publiée `@mairie360/lib-components/styles.css`, qui remplace la copie locale `municipal-theme.css`. L'écran de chargement « Chargement du profil et de la console… » affiche les `Skeleton` partagés. D'après la PR, les résultats vides sont désormais libellés et les confirmations d'action peuvent être refermées, sans perte des brouillons ni des messages d'échec contextuels (diff tronqué). (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Le lien d'évitement est désormais unique et placé avant la navigation répétée. (MAIR-526, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances et contrats, en 4 PR :
  - le socle partagé (session, garde du proxy, CSP, thème, contexte d'instance) passe de l'archive `@mairie360/front-kit` aux sous-chemins de `@mairie360/lib-components@0.10.2`, sans changement de comportement, avec un contrôle `npm run test:bundle` du bundle client ;
  - `@mairie360/bff-user-openapi` passe de `0.0.0-dev.46a698b…` à `1.0.0`, puis `0.0.0-dev.699a1ef…`, puis `0.0.0-staging.b6b04cf…`, sans changement de contrat. La politique de version accepte désormais `0.0.0-staging.<sha40>` ;
  - les images des stacks de test sont alignées : `bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0.
  
  (MAIR-126, MAIR-569, MAIR-575, MAIR-600, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200), [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI/CD, en 3 PR :
  - jeton en lecture seule par défaut, droits d'écriture réservés au job de release ;
  - pipelines lancés sur push uniquement pour `main` ;
  - CICD passe en v4.3.1 puis v4.3.2 avec le journal des releases, et Renovate suit les épinglages SHA.
  
  (MAIR-436, MAIR-571, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191), [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 19:01 UTC | dev | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
