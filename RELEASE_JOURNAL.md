# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "34428b88911ac803ffdd5d90a57806ba564144f1", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-03 14:56 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `34428b8` | 2026-11-03 14:56 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- La console d'administration (`/`) change de structure visuelle et technique : les onglets ont désormais les identifiants `administration-tab-<clé>`, et l'en-tête de page, les boutons, les alertes, les toasts et les états de chargement viennent de la lib normalisée. L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes et états que le front Settings. Le tableau de sessions local est supprimé. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Pipeline CI : mairie360/CICD est passé de v4.4.3 à v5.3.0 (Renovate, MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238)), Node 24.22.1 et Next.js 16.4.2 avec nouveaux digests Docker ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227)), checklist RGPD des PR ([#158](https://github.com/mairie360/Administrator_Web_Service/pull/158)), stack d'accessibilité RGAA et script `accessibility_test.sh` ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232)), simulation d'usage RGPD ([#240](https://github.com/mairie360/Administrator_Web_Service/pull/240)).
- Dépendances : follow-redirects 1.16.2 ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234)) ; zod remplacé par le backport vendorisé et preuve de bundle par source maps, sans effet en production ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236)).
- Tests et outillage : tests de politique CI et de pin, configuration Gitleaks et ZAP, scripts d'accessibilité et de simulation RGPD.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- La console d'administration (`/`) change de structure visuelle et technique : les onglets ont désormais les identifiants `administration-tab-<clé>`, et l'en-tête de page, les boutons, les alertes, les toasts et les états de chargement viennent de la lib normalisée. L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes et états que le front Settings. Le tableau de sessions local est supprimé. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Pipeline CI : mairie360/CICD est passé de v4.4.3 à v5.3.0 (Renovate, MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238)), Node 24.22.1 et Next.js 16.4.2 avec nouveaux digests Docker ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227)), checklist RGPD des PR ([#158](https://github.com/mairie360/Administrator_Web_Service/pull/158)), stack d'accessibilité RGAA et script `accessibility_test.sh` ([#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232)), simulation d'usage RGPD ([#240](https://github.com/mairie360/Administrator_Web_Service/pull/240)).
- Dépendances : follow-redirects 1.16.2 ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234)) ; zod remplacé par le backport vendorisé et preuve de bundle par source maps, sans effet en production ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236)).
- Tests et outillage : tests de politique CI et de pin, configuration Gitleaks et ZAP, scripts d'accessibilité et de simulation RGPD.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
