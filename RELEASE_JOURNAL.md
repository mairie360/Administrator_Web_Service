# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "0145926d82f9364f40dfc9560a4f7bf59b9b19f6", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "3b39b493511c215d1fc91f42d280b37853a14173", "updated": {"dev": "2026-10-19 22:12 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `3b39b49` | — |
| dev | — | `0145926` | 2026-10-19 22:12 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Changements de comportement
- La console d'administration prend le thème commun de `@mairie360/lib-components` (passage de 0.8.0 à 0.9.0, feuille `@mairie360/lib-components/styles.css`). La copie locale `src/app/municipal-theme.css` est supprimée. L'écran de chargement « Chargement du profil et de la console… » affiche désormais les placeholders `Skeleton` de la lib. D'après la PR, les panneaux utilisateurs, groupes, rôles et sessions utilisent aussi les états vides libellés et les confirmations d'action refermables de la lib, et le lien d'évitement passe avant la navigation répétée. Ce point est à confirmer, car le diff est tronqué. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances :
  - Le socle partagé (session, proxy, garde, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components@0.10.2` au lieu de l'archive `@mairie360/front-kit` vendorisée, sans changement de comportement. Le test de bundle client `npm run test:bundle` est ajouté. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le contrat `@mairie360/bff-user-openapi` passe à `1.0.0`. Les stacks docker-compose passent à `bff-user:1.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196))
  - Un backport de développement de `braces` est ajouté. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI :
  - Le jeton est en lecture seule par défaut, et seul le job `CICD` reçoit les droits d'écriture. Les pipelines ne tournent plus sur `push` que pour `main`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - Le workflow `mairie360/CICD` passe en v4.3.1, avec l'étape de journal de release et ses secrets. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La console d'administration prend le thème commun de `@mairie360/lib-components` (passage de 0.8.0 à 0.9.0, feuille `@mairie360/lib-components/styles.css`). La copie locale `src/app/municipal-theme.css` est supprimée. L'écran de chargement « Chargement du profil et de la console… » affiche désormais les placeholders `Skeleton` de la lib. D'après la PR, les panneaux utilisateurs, groupes, rôles et sessions utilisent aussi les états vides libellés et les confirmations d'action refermables de la lib, et le lien d'évitement passe avant la navigation répétée. Ce point est à confirmer, car le diff est tronqué. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Dépendances :
  - Le socle partagé (session, proxy, garde, thème, contexte d'instance) est importé depuis les sous-chemins de `@mairie360/lib-components@0.10.2` au lieu de l'archive `@mairie360/front-kit` vendorisée, sans changement de comportement. Le test de bundle client `npm run test:bundle` est ajouté. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
  - Le contrat `@mairie360/bff-user-openapi` passe à `1.0.0`. Les stacks docker-compose passent à `bff-user:1.0.0`, `core-api:2.1.0`, `database:3.2.0` et `liquibase-migrations:3.2.0`. (MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196))
  - Un backport de développement de `braces` est ajouté. (MAIR-526, MAIR-515, MAIR-540, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- CI :
  - Le jeton est en lecture seule par défaut, et seul le job `CICD` reçoit les droits d'écriture. Les pipelines ne tournent plus sur `push` que pour `main`. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
  - Le workflow `mairie360/CICD` passe en v4.3.1, avec l'étape de journal de release et ses secrets. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-19 22:12 UTC | dev | — | `0145926` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39332752630) |
| 2026-10-19 20:14 UTC | dev | — | `826f314` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39316489740) |
<!-- release-journal-history:end -->
