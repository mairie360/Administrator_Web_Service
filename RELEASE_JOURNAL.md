# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "6d839f4114b4e1697e226b71f240d73a1cbd95de", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-04 18:38 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `6d839f4` | 2026-11-04 18:38 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- L'onglet Sessions de la console rend désormais le `SessionList` de la bibliothèque partagée (`@mairie360/lib-components/primitives`) au lieu d'un tableau local : mêmes colonnes (appareil, IP, création, expiration, état) et mêmes états chargement / vide / indisponible. Les onglets de la console portent les ids `administration-tab-<key>`. (MAIR-608 / MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Le shell de l'application (barre latérale, barre supérieure, pied) vient de `@mairie360/lib-components/shell` ; la copie locale `desktop-navigation.tsx` est supprimée. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Corrections
- Gitleaks ne masquait que par chemin le fichier `vendor/security-patches.json` : un vrai secret ajouté puis retiré de ce manifeste n'était jamais signalé. Avant : tout le fichier était ignoré pour toutes les règles. Maintenant : seule la règle `generic-api-key` est ignorée, et seulement pour un digest SHA-256 de 64 caractères hexadécimaux. (MAIR-743, [#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))

#### Nouveautés
- Simulation d'usage RGPD avant la prod : `docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`, `gdpr-journey.yaml` et `gdpr_simulation_test.sh` font parcourir quatre personas fictives sur `/?tab=users&usersSearch=…` et `/?tab=sessions`, puis vérifient la purge et les logs. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Nouveau check `gdpr / GDPR checklist` sur chaque PR : la section « Personal data » doit être cochée, et un « Yes » exige la ligne `Inventory:`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))

#### Technique
- Pin `mairie360/CICD` porté de v4.4.3 à v5.3.1 dans les workflows cicd, promote-staging, promote-prod, dev-dependency-exception et gdpr-pr (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241)).
- Le backport `vendor/zod` (3.25.76+mairie360.1) remplace zod 3.25.76 ; `postinstall`, `prebuild` et `pretest` vérifient son intégrité hors ligne. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Next passe de 16.3.8 à 16.4.2, Node de 24.21.0 à 24.22.1 (image Dockerfile et CI) ; correctif de sécurité Next et Node. (MAIR-... sans clé, [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- `follow-redirects` monté en 1.16.2 (GHSA-mrwp-f3q8-3g9p), avec un test de lock. ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, verrou `.rgaa-run.lock` et attentes bornées. ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Profils CI de bundle : sources maps émises seulement par la mesure CI (`MAIRIE360_BUNDLE_PROVENANCE=1`) ; ZAP 10031 classé hors périmètre pour `/?tab=users|roles|groups|sessions`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Tests : mises à jour de `tests/ci-policy.test.cjs`, `tests/zod-manifest-digests.test.cjs` et de la suite des composants de la console.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'onglet Sessions de la console rend désormais le `SessionList` de la bibliothèque partagée (`@mairie360/lib-components/primitives`) au lieu d'un tableau local : mêmes colonnes (appareil, IP, création, expiration, état) et mêmes états chargement / vide / indisponible. Les onglets de la console portent les ids `administration-tab-<key>`. (MAIR-608 / MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Le shell de l'application (barre latérale, barre supérieure, pied) vient de `@mairie360/lib-components/shell` ; la copie locale `desktop-navigation.tsx` est supprimée. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Corrections
- Gitleaks ne masquait que par chemin le fichier `vendor/security-patches.json` : un vrai secret ajouté puis retiré de ce manifeste n'était jamais signalé. Avant : tout le fichier était ignoré pour toutes les règles. Maintenant : seule la règle `generic-api-key` est ignorée, et seulement pour un digest SHA-256 de 64 caractères hexadécimaux. (MAIR-743, [#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))

#### Nouveautés
- Simulation d'usage RGPD avant la prod : `docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`, `gdpr-journey.yaml` et `gdpr_simulation_test.sh` font parcourir quatre personas fictives sur `/?tab=users&usersSearch=…` et `/?tab=sessions`, puis vérifient la purge et les logs. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Nouveau check `gdpr / GDPR checklist` sur chaque PR : la section « Personal data » doit être cochée, et un « Yes » exige la ligne `Inventory:`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))

#### Technique
- Pin `mairie360/CICD` porté de v4.4.3 à v5.3.1 dans les workflows cicd, promote-staging, promote-prod, dev-dependency-exception et gdpr-pr (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241)).
- Le backport `vendor/zod` (3.25.76+mairie360.1) remplace zod 3.25.76 ; `postinstall`, `prebuild` et `pretest` vérifient son intégrité hors ligne. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Next passe de 16.3.8 à 16.4.2, Node de 24.21.0 à 24.22.1 (image Dockerfile et CI) ; correctif de sécurité Next et Node. ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- `follow-redirects` monté en 1.16.2 (GHSA-mrwp-f3q8-3g9p), avec un test de lock. ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, verrou `.rgaa-run.lock` et attentes bornées. ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Profils CI de bundle : sources maps émises seulement par la mesure CI (`MAIRIE360_BUNDLE_PROVENANCE=1`) ; ZAP 10031 classé hors périmètre pour `/?tab=users|roles|groups|sessions`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Tests : mises à jour de `tests/ci-policy.test.cjs`, `tests/zod-manifest-digests.test.cjs` et de la suite des composants de la console.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 18:38 UTC | dev | — | `6d839f4` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41887966406) |
| 2026-11-04 18:19 UTC | dev | — | `2daa38f` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41882871131) |
| 2026-11-03 14:56 UTC | dev | — | `34428b8` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41656717714) |
| 2026-11-02 22:59 UTC | dev | — | `c35c9c3` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41540110527) |
| 2026-11-02 16:50 UTC | dev | — | `4474021` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41483951100) |
| 2026-10-23 13:27 UTC | dev | — | `195329a` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39960502537) |
| 2026-10-23 13:25 UTC | dev | — | `45ee11b` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39960091914) |
| 2026-10-21 18:00 UTC | dev | — | `eab10e0` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39647814229) |
| 2026-10-21 11:08 UTC | prod | v1.2.0 | `bea8f87` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/39588834937) |
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
