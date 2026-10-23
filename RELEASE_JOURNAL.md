# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "195329a6cd105a10db742c7ec9df6800ea23ac51", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-10-23 13:27 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `195329a` | 2026-10-23 13:27 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- Onglet Sessions de la console : la liste utilise désormais le composant partagé `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; états chargement, vide et indisponible alignés sur le front Settings). L'ancienne table locale et `administration-session-state.ts` sont supprimés. Le basculement Actives / Historique et le rafraîchissement sont conservés. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Console d'administration : les onglets utilisent le composant `Tabs` de la lib, avec les identifiants `administration-tab-<clé>` ; l'en-tête, les alertes, les toasts et les boutons passent aux composants normalisés de la lib (rendu visuel modifié). Un test ou un script qui cible les anciens identifiants d'onglets devra être adapté. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Navigation latérale : le shell `AccessibleShell` vient de `@mairie360/lib-components/shell` ; la navigation de bureau et la préférence de barre latérale locales sont retirées, et le shell reste inerte pendant qu'une confirmation `alertdialog` est ouverte. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Mise à jour de la référence `mairie360/CICD` de v4.4.3 à v4.5.0 dans les workflows `cicd.yml`, `dev-dependency-exception.yml`, `promote-prod.yml` et `promote-staging.yml` ; la v4.5.0 ajoute des tests d'intégration côté CI. ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- Node.js passe de 24.21.0 à 24.22.1 (CI, image Docker avec nouveaux digests, tests de politique CI) et Next.js ainsi qu'eslint-config-next de 16.3.8 à 16.4.2, correctifs de sécurité. L'image Docker livrée change donc de runtime sans changement fonctionnel décrit. ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Réorganisation de la page d'administration sous `src/components/AdministrationPage/` en arborescence de dossiers par composant, avec tests co-localisés, règle de structure (`tests/component-tree-convention.test.cjs`), configuration vitest et documentation Figma. Le diff de `package.json` est tronqué : la montée de version de la lib n'est pas vérifiable ici. ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Onglet Sessions de la console : la liste utilise désormais le composant partagé `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; états chargement, vide et indisponible alignés sur le front Settings). L'ancienne table locale et `administration-session-state.ts` sont supprimés. Le basculement Actives / Historique et le rafraîchissement sont conservés. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Console d'administration : les onglets utilisent le composant `Tabs` de la lib, avec les identifiants `administration-tab-<clé>` ; l'en-tête, les alertes, les toasts et les boutons passent aux composants normalisés de la lib (rendu visuel modifié). Un test ou un script qui cible les anciens identifiants d'onglets devra être adapté. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Navigation latérale : le shell `AccessibleShell` vient de `@mairie360/lib-components/shell` ; la navigation de bureau et la préférence de barre latérale locales sont retirées, et le shell reste inerte pendant qu'une confirmation `alertdialog` est ouverte. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Mise à jour de la référence `mairie360/CICD` de v4.4.3 à v4.5.0 dans les workflows `cicd.yml`, `dev-dependency-exception.yml`, `promote-prod.yml` et `promote-staging.yml` ; la v4.5.0 ajoute des tests d'intégration côté CI. ([#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- Node.js passe de 24.21.0 à 24.22.1 (CI, image Docker avec nouveaux digests, tests de politique CI) et Next.js ainsi qu'eslint-config-next de 16.3.8 à 16.4.2, correctifs de sécurité. L'image Docker livrée change donc de runtime sans changement fonctionnel décrit. ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Réorganisation de la page d'administration sous `src/components/AdministrationPage/` en arborescence de dossiers par composant, avec tests co-localisés, règle de structure (`tests/component-tree-convention.test.cjs`), configuration vitest et documentation Figma. Le diff de `package.json` est tronqué : la montée de version de la lib n'est pas vérifiable ici. ([#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
