# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "078db63981fc9099cb68adc3d2b32b4cc1e1eeba", "updated": {"dev": "2026-10-20 19:01 UTC", "staging": "2026-10-20 19:07 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `078db63` | 2026-10-20 19:07 UTC |
| dev | — | `078db63` | 2026-10-20 19:01 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- La console d'administration utilise le thème commun et la feuille de style publiés par `@mairie360/lib-components` (`@mairie360/lib-components/styles.css`). La copie locale `municipal-theme.css` est supprimée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- L'écran de chargement « Chargement du profil et de la console… » affiche les espaces réservés partagés (`Skeleton`). D'après la PR, les tableaux vides affichent aussi un message explicite et les confirmations d'action peuvent être fermées ; les brouillons et les messages d'erreur contextuels sont conservés. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Accessibilité : un seul lien d'évitement, placé avant la navigation répétée, mène à la zone principale. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Socle partagé et contrat BFF :
  - Les fonctions de session (renouvellement, déconnexion, reprise), la garde du proxy, le thème et le contexte d'instance sont maintenant importés de `@mairie360/lib-components@0.10.2` au lieu de l'archive `@mairie360/front-kit`, sans changement de comportement annoncé. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Un nouveau test `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le paquet de contrat `@mairie360/bff-user-openapi` passe successivement à `1.0.0`, `0.0.0-dev.699a1ef…` puis `0.0.0-staging.b6b04cf…`. Les images des stacks de test suivent (`bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0). Le contrat relayé (`contracts/openapi.json`) ne change que dans sa métadonnée de source. (MAIR-569, MAIR-575, MAIR-600, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
  - La politique de version accepte désormais `0.0.0-staging.<sha40>`, associé à l'image `staging-<sha7>`. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI : trois changements, sans effet sur le service.
  - Jeton en lecture seule par défaut et pipeline déclenché au push sur `main` uniquement. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - Passage à CICD v4.3.1 puis v4.3.2, avec le journal des releases et les secrets associés. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))
  - Épinglage suivi par Renovate et nouveau test `tests/cicd-pin.test.cjs`. (MAIR-571, [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Changements de comportement
- La console d'administration utilise le thème commun et la feuille de style publiés par `@mairie360/lib-components` (`@mairie360/lib-components/styles.css`). La copie locale `municipal-theme.css` est supprimée. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- L'écran de chargement « Chargement du profil et de la console… » affiche les espaces réservés partagés (`Skeleton`). D'après la PR, les tableaux vides affichent aussi un message explicite et les confirmations d'action peuvent être fermées ; les brouillons et les messages d'erreur contextuels sont conservés. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Accessibilité : un seul lien d'évitement, placé avant la navigation répétée, mène à la zone principale. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Socle partagé et contrat BFF :
  - Les fonctions de session (renouvellement, déconnexion, reprise), la garde du proxy, le thème et le contexte d'instance sont maintenant importés de `@mairie360/lib-components@0.10.2` au lieu de l'archive `@mairie360/front-kit`, sans changement de comportement annoncé. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Un nouveau test `npm run test:bundle` vérifie le bundle client. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le paquet de contrat `@mairie360/bff-user-openapi` passe successivement à `1.0.0`, `0.0.0-dev.699a1ef…` puis `0.0.0-staging.b6b04cf…`. Les images des stacks de test suivent (`bff-user`, `core-api` 2.1.0, `database` et `liquibase-migrations` 3.2.0). Le contrat relayé (`contracts/openapi.json`) ne change que dans sa métadonnée de source. (MAIR-569, MAIR-575, MAIR-600, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196), [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204), [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
  - La politique de version accepte désormais `0.0.0-staging.<sha40>`, associé à l'image `staging-<sha7>`. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206))
- CI : trois changements, sans effet sur le service.
  - Jeton en lecture seule par défaut et pipeline déclenché au push sur `main` uniquement. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - Passage à CICD v4.3.1 puis v4.3.2, avec le journal des releases et les secrets associés. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198), [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))
  - Épinglage suivi par Renovate et nouveau test `tests/cicd-pin.test.cjs`. (MAIR-571, [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-20 19:07 UTC | staging | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 19:01 UTC | dev | — | `078db63` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39478991614) |
| 2026-10-20 13:42 UTC | dev | — | `a266ffd` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39431878293) |
| 2026-10-20 12:22 UTC | dev | — | `a758fd0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39421264667) |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
