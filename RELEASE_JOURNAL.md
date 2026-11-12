# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "2eee7643454636522027726c336bd940abb2beb8", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "2eee7643454636522027726c336bd940abb2beb8", "updated": {"dev": "2026-11-12 17:06 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-11-12 19:05 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `2eee764` | 2026-11-12 19:05 UTC |
| dev | — | `2eee764` | 2026-11-12 17:06 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#247](https://github.com/mairie360/Administrator_Web_Service/pull/247))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#245) ([#245](https://github.com/mairie360/Administrator_Web_Service/pull/245))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#225) ([#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#243) ([#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#240](https://github.com/mairie360/Administrator_Web_Service/pull/240))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#238) ([#238](https://github.com/mairie360/Administrator_Web_Service/pull/238))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#153) ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#158) ([#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#226) ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- fix(security): patch Node.js and Next.js (#227) ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence dev → staging (en dev, pas encore en staging)

_Rien._

## Différence staging → prod (en staging, pas encore en prod)

- fix: MAIR-816 Release dev: align internal versions and deploy ([#247](https://github.com/mairie360/Administrator_Web_Service/pull/247))
- chore(deps): update dependency mairie360/cicd to v5.6.0 (#245) ([#245](https://github.com/mairie360/Administrator_Web_Service/pull/245))
- feat: MAIR-603 E2E - Parcours utilisateurs Playwright des fronts (#225) ([#225](https://github.com/mairie360/Administrator_Web_Service/pull/225))
- fix: MAIR-743 [Audit 30/10] Login, Calendars, Elearning, Projects: branch Gitleaks fingerprints invalid after squash, main likely red (N1) (#243) ([#243](https://github.com/mairie360/Administrator_Web_Service/pull/243))
- fix: MAIR-497 GDPR - Usage simulation and AI review of logs and database before prod ([#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- feat: MAIR-497 RGPD - Simulation d'usage et revue IA des logs et de la base avant la prod ([#240](https://github.com/mairie360/Administrator_Web_Service/pull/240))
- ci: MAIR-771 APIs, BFFs, Database : monter CICD en v5.2.2 pour activer les contrôles RGPD (#238) ([#238](https://github.com/mairie360/Administrator_Web_Service/pull/238))
- fix(security): MAIR-770 Administrator, Dashboard, Messages, Settings : porter le correctif zod et la preuve de bundle par source maps ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- fix(deps): bump follow-redirects to 1.16.2 (GHSA-mrwp-f3q8-3g9p) ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- fix: MAIR-768 RGAA - Aligner les stacks d'accessibilité des fronts mergés en premier ([#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- feat: MAIR-316 RGAA - Périmètre et états des pages par front (#153) ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153))
- ci: MAIR-295 Ajouter une checklist RGPD aux PR et des rappels d'échéances automatiques (#158) ([#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- chore(deps): update dependency mairie360/cicd to v4.5.0 (#226) ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- fix(security): patch Node.js and Next.js (#227) ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- feat!: MAIR-608 Lib UI - Normaliser la charte, les tailles et les composants partagés des fronts ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

> Résumé Claude indisponible pour ce passage : listes brutes des commits.

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
| 2026-11-12 19:05 UTC | staging | — | `2eee764` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/43285853601) |
| 2026-11-12 17:06 UTC | dev | — | `2eee764` | [run](https://github.com/mairie360/Administrator_Web_Service/actions/runs/43264127284) |
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
