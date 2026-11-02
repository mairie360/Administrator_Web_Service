# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "447402186a3e9e2e12b10918139e52fb3dc5ed8e", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-02 16:50 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `4474021` | 2026-11-02 16:50 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- L'administration est reconstruite sur les composants normalisés de `@mairie360/lib-components` : en-tête de page, onglets, contrôle segmenté, états de chargement et d'erreur, alertes, toasts, boutons et cases à cocher. Les onglets portent les identifiants `administration-tab-<clé>`. L'apparence et les libellés peuvent changer ; les tests qui ciblaient les anciens sélecteurs sont à revoir. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions n'affiche plus la table locale mais le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement / vide / indisponible. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La barre latérale et la barre supérieure viennent de `AccessibleShell` de la lib. Le shell reste inerte tant qu'une fenêtre de confirmation (`alertdialog`) est ouverte. La préférence de barre latérale est gérée par la lib. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Dépendances et sécurité : `zod` est remplacé par le backport `vendor/zod` (3.25.76+mairie360.1) via un override, avec une vérification d'intégrité lancée en `postinstall`, `prebuild` et `pretest` (hors ligne) ; cette vérification peut faire échouer une installation si le vendor est altéré. `follow-redirects` passe en 1.16.2 ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234)). Next.js et `eslint-config-next` passent en 16.4.2, Node en 24.22.1 (Dockerfile et CI) ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227)). (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Preuve de bundle : `test:bundle` vérifie l'appartenance des modules à la lib via les source maps, produites seulement par le build de mesure CI (`MAIRIE360_BUNDLE_PROVENANCE=1`). Gitleaks ignore `vendor/security-patches.json` par chemin, et ZAP ignore l'alerte 10031 sur `/?tab=sessions`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql` et `rgaa.yaml`, avec un verrou de run et un rapport vidé à chaque exécution. Le moteur mairie360/CICD est épinglé en v5.1.0 dans `cicd.yml` et les workflows promote ; `promote-prod.yml` passe `ANTHROPIC_WORKSPACE_ID`. ([#232](https://github.com/mairie360/Administrator_Web_Service/pull/232), [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153))
- Renovate fait passer mairie360/CICD de v4.4.3 à v4.5.0 ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226)).
- Nouveau workflow `gdpr-pr.yml` : un check « GDPR checklist » s'exécute sur chaque PR et exige la réponse « Personal data » (et l'inventaire si « Oui »). Il est épinglé à mairie360/CICD v4.12.2 et doit être rendu requis dans la protection de `main`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Tests : chaque composant de `src/components/` a un `Name.test.tsx` co-localisé, contrôlé par `tests/component-tree-convention.test.cjs`, et `npm test` lance aussi `test:components`. ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- L'administration est reconstruite sur les composants normalisés de `@mairie360/lib-components` : en-tête de page, onglets, contrôle segmenté, états de chargement et d'erreur, alertes, toasts, boutons et cases à cocher. Les onglets portent les identifiants `administration-tab-<clé>`. L'apparence et les libellés peuvent changer ; les tests qui ciblaient les anciens sélecteurs sont à revoir. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions n'affiche plus la table locale mais le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement / vide / indisponible. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La barre latérale et la barre supérieure viennent de `AccessibleShell` de la lib. Le shell reste inerte tant qu'une fenêtre de confirmation (`alertdialog`) est ouverte. La préférence de barre latérale est gérée par la lib. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Dépendances et sécurité : `zod` est remplacé par le backport `vendor/zod` (3.25.76+mairie360.1) via un override, avec une vérification d'intégrité lancée en `postinstall`, `prebuild` et `pretest` (hors ligne) ; cette vérification peut faire échouer une installation si le vendor est altéré. `follow-redirects` passe en 1.16.2 ([#234](https://github.com/mairie360/Administrator_Web_Service/pull/234)). Next.js et `eslint-config-next` passent en 16.4.2, Node en 24.22.1 (Dockerfile et CI) ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227)). (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Preuve de bundle : `test:bundle` vérifie l'appartenance des modules à la lib via les source maps, produites seulement par le build de mesure CI (`MAIRIE360_BUNDLE_PROVENANCE=1`). Gitleaks ignore `vendor/security-patches.json` par chemin, et ZAP ignore l'alerte 10031 sur `/?tab=sessions`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Stack d'accessibilité RGAA : `accessibility_test.sh`, `docker-compose-accessibility.yml`, `init-accessibility.sql` et `rgaa.yaml`, avec un verrou de run et un rapport vidé à chaque exécution. Le moteur mairie360/CICD est épinglé en v5.1.0 dans `cicd.yml` et les workflows promote ; `promote-prod.yml` passe `ANTHROPIC_WORKSPACE_ID`. ([#232](https://github.com/mairie360/Administrator_Web_Service/pull/232), [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153))
- Renovate fait passer mairie360/CICD de v4.4.3 à v4.5.0 ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226)).
- Nouveau workflow `gdpr-pr.yml` : un check « GDPR checklist » s'exécute sur chaque PR et exige la réponse « Personal data » (et l'inventaire si « Oui »). Il est épinglé à mairie360/CICD v4.12.2 et doit être rendu requis dans la protection de `main`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Tests : chaque composant de `src/components/` a un `Name.test.tsx` co-localisé, contrôlé par `tests/component-tree-convention.test.cjs`, et `npm test` lance aussi `test:components`. ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
