# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod": "3b39b493511c215d1fc91f42d280b37853a14173", "prod_tag": "v1.1.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-10-21 10:50 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.1.0 | `3b39b49` | — |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `bea8f87` | 2026-10-21 10:50 UTC |

## Ajouté sur main depuis la dernière release prod (v1.1.0)

#### Nouveautés
- Les actions réussies affichent un reçu de confirmation fermable, les résultats vides portent un libellé explicite, et les brouillons sont conservés en cas d'échec avec un message contextuel. D'après la description de la PR (diff tronqué). (#194, [#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Un lien d'évitement (skip link) précède la navigation répétée et mène à la zone principale. D'après la description de la PR (diff tronqué). ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Le thème municipal propre au front (`src/app/municipal-theme.css`) est supprimé : l'apparence vient désormais de la feuille de style publiée de `@mairie360/lib-components` 0.9.0, et le chargement de la page affiche des placeholders `Skeleton` de la lib. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Contrat BFF User épinglé sur `@mairie360/bff-user-openapi` 1.1.0, avec l'image `bff-user` 1.1.0 dans les stacks de test ; le contrat ne change que son identifiant source. (MAIR-612, [#222](https://github.com/mairie360/Administrator_Web_Service/pull/222))
- Stacks de test : images `database` et `liquibase-migrations` en 3.3.0, `core-api` en 2.2.0. ([#221](https://github.com/mairie360/Administrator_Web_Service/pull/221), [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220))
- Le paquet `@mairie360/front-kit` (archive vendue) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2, avec un test de bundle client ajouté au workflow de performance. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Politique de version des contrats acceptant `0.0.0-staging.<sha40>` ; contrat BFF en 1.0.0 puis 1.1.0 au fil des releases. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206) ; MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204))
- Workflows CI : `promote-staging.yml` et `promote-prod.yml` ajoutés en déclenchement manuel, et `cicd.yml` ne se déclenche plus sur les push hors `main`. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213) ; MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Jeton des workflows en lecture seule par défaut, écriture accordée au seul job de release. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Dépendances CICD (`mairie360/CICD`) mises à jour de v4.3.2 à v4.4.3, avec les secrets du journal de release transmis. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198) ; [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202) ; [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209) ; [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214) ; [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216) ; [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- `braces` ajouté en devDependency depuis un vendor local, avec override. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

#### Nouveautés
- Les actions réussies affichent un reçu de confirmation fermable, les résultats vides portent un libellé explicite, et les brouillons sont conservés en cas d'échec avec un message contextuel. D'après la description de la PR (diff tronqué). ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))
- Un lien d'évitement (skip link) précède la navigation répétée et mène à la zone principale. D'après la description de la PR (diff tronqué). ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Changements de comportement
- Le thème municipal propre au front (`src/app/municipal-theme.css`) est supprimé : l'apparence vient désormais de la feuille de style publiée de `@mairie360/lib-components` 0.9.0, et le chargement de la page affiche des placeholders `Skeleton` de la lib. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

#### Technique
- Contrat BFF User épinglé sur `@mairie360/bff-user-openapi` 1.1.0, avec l'image `bff-user` 1.1.0 dans les stacks de test ; le contrat ne change que son identifiant source. (MAIR-612, [#222](https://github.com/mairie360/Administrator_Web_Service/pull/222))
- Stacks de test : images `database` et `liquibase-migrations` en 3.3.0, `core-api` en 2.2.0. ([#221](https://github.com/mairie360/Administrator_Web_Service/pull/221), [#220](https://github.com/mairie360/Administrator_Web_Service/pull/220))
- Le paquet `@mairie360/front-kit` (archive vendue) est remplacé par les sous-chemins de `@mairie360/lib-components` 0.10.2, avec un test de bundle client ajouté au workflow de performance. (MAIR-126, [#200](https://github.com/mairie360/Administrator_Web_Service/pull/200))
- Politique de version des contrats acceptant `0.0.0-staging.<sha40>` ; contrat BFF en 1.0.0 puis 1.1.0 au fil des releases. (MAIR-600, [#206](https://github.com/mairie360/Administrator_Web_Service/pull/206) ; MAIR-569, [#196](https://github.com/mairie360/Administrator_Web_Service/pull/196) ; MAIR-575, [#204](https://github.com/mairie360/Administrator_Web_Service/pull/204))
- Workflows CI : `promote-staging.yml` et `promote-prod.yml` ajoutés en déclenchement manuel, et `cicd.yml` ne se déclenche plus sur les push hors `main`. (MAIR-494, [#213](https://github.com/mairie360/Administrator_Web_Service/pull/213) ; MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Jeton des workflows en lecture seule par défaut, écriture accordée au seul job de release. (MAIR-436, [#191](https://github.com/mairie360/Administrator_Web_Service/pull/191))
- Dépendances CICD (`mairie360/CICD`) mises à jour de v4.3.2 à v4.4.3, avec les secrets du journal de release transmis. (MAIR-571, [#198](https://github.com/mairie360/Administrator_Web_Service/pull/198) ; [#202](https://github.com/mairie360/Administrator_Web_Service/pull/202) ; [#209](https://github.com/mairie360/Administrator_Web_Service/pull/209) ; [#214](https://github.com/mairie360/Administrator_Web_Service/pull/214) ; [#216](https://github.com/mairie360/Administrator_Web_Service/pull/216) ; [#219](https://github.com/mairie360/Administrator_Web_Service/pull/219))
- `braces` ajouté en devDependency depuis un vendor local, avec override. ([#194](https://github.com/mairie360/Administrator_Web_Service/pull/194))

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-10-21 11:00 UTC | staging | — | `bea8f87` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39587626670) |
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
