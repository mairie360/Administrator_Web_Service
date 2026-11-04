# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "376b819c6a9d0600fbf20792169eefa9fa370258", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-04 21:27 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `376b819` | 2026-11-04 21:27 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- Les onglets de la console utilisent des identifiants `administration-tab-<clé>`. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement, vide et indisponible. La table locale est supprimée. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La barre latérale et l'en-tête viennent de `AccessibleShell` de la lib ; les modules dont l'URL `*_FRONT_URL` n'est pas configurée sont masqués. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les écrans de la console utilisent les composants normalisés de la lib (en-tête, onglets, boutons, alertes, toasts, pagination). (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Parcours E2E Playwright (administration, refus pour un utilisateur sans droits) avec `docker-compose-e2e.yml`, `e2e_test.sh` et le job `e2e_tests` de la promotion prod. (MAIR-603, [#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- Gitleaks : allowlist limitée aux digests SHA-256 de `vendor/security-patches.json`, test de politique et manifeste canonique. (MAIR-743, [#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))
- Backport zod vendu (`file:vendor/zod`), vérifications d'intégrité hors ligne en `postinstall`, `prebuild` et `pretest`, preuve de bundle par source maps en CI. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Dépendances : `follow-redirects` 1.16.2 (GHSA-mrwp-f3q8-3g9p) et test de politique associé. (sans ticket, [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Dépendances : Next.js et `eslint-config-next` en 16.4.2, Node 24.22.1 avec image de base patchée. (sans ticket, [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Simulation d'usage RGPD (`docker-compose-gdpr-simulation.yml`, `gdpr_simulation_test.sh`, `gdpr-simulation.yaml`) et correctifs du script. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Stack d'accessibilité RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, `rgaa.yaml`), répertoire de rapport vidé à chaque run et verrou de run. (MAIR-316, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153) ; MAIR-768, [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Checklist RGPD des pull requests (`gdpr-pr.yml`). (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Pins de mairie360/CICD : v5.2.2, puis v5.3.0, v5.3.1 et v5.5.0 dans les workflows. (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238) ; [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240) ; [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241) ; [#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- Renovate : mise à jour de mairie360/CICD v4.4.3 vers v4.5.0, remplacée ensuite par les pins suivants. ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les onglets de la console utilisent des identifiants `administration-tab-<clé>`. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement, vide et indisponible. La table locale est supprimée. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La barre latérale et l'en-tête viennent de `AccessibleShell` de la lib ; les modules dont l'URL `*_FRONT_URL` n'est pas configurée sont masqués. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les écrans de la console utilisent les composants normalisés de la lib (en-tête, onglets, boutons, alertes, toasts, pagination). (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Parcours E2E Playwright (administration, refus pour un utilisateur sans droits) avec `docker-compose-e2e.yml`, `e2e_test.sh` et le job `e2e_tests` de la promotion prod. (MAIR-603, [#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- Gitleaks : allowlist limitée aux digests SHA-256 de `vendor/security-patches.json`, test de politique et manifeste canonique. (MAIR-743, [#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))
- Backport zod vendu (`file:vendor/zod`), vérifications d'intégrité hors ligne en `postinstall`, `prebuild` et `pretest`, preuve de bundle par source maps en CI. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Dépendances : `follow-redirects` 1.16.2 (GHSA-mrwp-f3q8-3g9p) et test de politique associé. (sans ticket, [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Dépendances : Next.js et `eslint-config-next` en 16.4.2, Node 24.22.1 avec image de base patchée. (sans ticket, [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Simulation d'usage RGPD (`docker-compose-gdpr-simulation.yml`, `gdpr_simulation_test.sh`, `gdpr-simulation.yaml`) et correctifs du script. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Stack d'accessibilité RGAA (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql`, `rgaa.yaml`), répertoire de rapport vidé à chaque run et verrou de run. (MAIR-316, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153) ; MAIR-768, [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Checklist RGPD des pull requests (`gdpr-pr.yml`). (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Pins de mairie360/CICD : v5.2.2, puis v5.3.0, v5.3.1 et v5.5.0 dans les workflows. (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238) ; [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240) ; [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241) ; [#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- Renovate : mise à jour de mairie360/CICD v4.4.3 vers v4.5.0, remplacée ensuite par les pins suivants. ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-04 21:27 UTC | dev | — | `376b819` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/41914656130) |
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
