# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "c35c9c3c158ba7258df4eb7f7fe69c5540e525b2", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-02 22:59 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `c35c9c3` | 2026-11-02 22:59 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- Les onglets de la console d'administration ont désormais des identifiants DOM normalisés `administration-tab-<key>` ; un sélecteur ou un test qui visait l'ancien identifiant doit être mis à jour. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le composant `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; mêmes états chargement, vide et indisponible que Settings) à la place de la table locale. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La console est recomposée sur les primitives de la lib (`PageHeader`, `Tabs`, `SegmentedControl`, `DataState`, `ErrorAlert` / `WarningAlert`, `Toast` par ton, boutons prédéfinis, `AccessibleShell`) ; le shell et la barre de navigation locaux disparaissent. Le diff étant tronqué, le rendu visuel exact reste à vérifier à l'écran. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Dépendances et runtime : Next.js 16.3.8 → 16.4.2, Node 24.21.0 → 24.22.1 (Dockerfile, CI, contrats), `follow-redirects` 1.16.2 dans le lock, et `zod` remplacé par le backport vendoré 3.25.76+mairie360.1 avec vérification d'intégrité au `postinstall`, `prebuild` et `pretest`. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236) ; [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234) ; [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- CI : mairie360/CICD passé en v5.2.2 dans les workflows, ce qui active les contrôles RGPD (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238)) ; nouveau workflow `gdpr-pr.yml` qui vérifie la checklist RGPD de chaque PR (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158)) ; mise à jour Renovate vers v4.5.0 (#226).
- Tests d'accessibilité RGAA et bundle : script `accessibility_test.sh`, stack `docker-compose-accessibility.yml`, preuve de bundle par source maps et exclusion ZAP 10031 sur `/?tab=sessions` ; aucun effet sur l'application livrée. (MAIR-316, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153) ; MAIR-768, [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232) ; MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- La PR #218 est décrite comme brouillon, empilée sur #212, à ne pas fusionner avant la publication de la lib-components majeure qui la porte.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les onglets de la console d'administration ont désormais des identifiants DOM normalisés `administration-tab-<key>` ; un sélecteur ou un test qui visait l'ancien identifiant doit être mis à jour. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le composant `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; mêmes états chargement, vide et indisponible que Settings) à la place de la table locale. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La console est recomposée sur les primitives de la lib (`PageHeader`, `Tabs`, `SegmentedControl`, `DataState`, `ErrorAlert` / `WarningAlert`, `Toast` par ton, boutons prédéfinis, `AccessibleShell`) ; le shell et la barre de navigation locaux disparaissent. Le diff étant tronqué, le rendu visuel exact reste à vérifier à l'écran. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Dépendances et runtime : Next.js 16.3.8 → 16.4.2, Node 24.21.0 → 24.22.1 (Dockerfile, CI, contrats), `follow-redirects` 1.16.2 dans le lock, et `zod` remplacé par le backport vendoré 3.25.76+mairie360.1 avec vérification d'intégrité au `postinstall`, `prebuild` et `pretest`. (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236) ; [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234) ; [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- CI : mairie360/CICD passé en v5.2.2 dans les workflows, ce qui active les contrôles RGPD (MAIR-771, [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238)) ; nouveau workflow `gdpr-pr.yml` qui vérifie la checklist RGPD de chaque PR (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158)) ; mise à jour Renovate vers v4.5.0 (#226).
- Tests d'accessibilité RGAA et bundle : script `accessibility_test.sh`, stack `docker-compose-accessibility.yml`, preuve de bundle par source maps et exclusion ZAP 10031 sur `/?tab=sessions` ; aucun effet sur l'application livrée. (MAIR-316, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153) ; MAIR-768, [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232) ; MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- La PR #218 est décrite comme brouillon, empilée sur #212, à ne pas fusionner avant la publication de la lib-components majeure qui la porte.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
