# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "45ee11b9bfee1e7368fd2e6aa0da5673f6ab1614", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-10-23 13:25 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `45ee11b` | 2026-10-23 13:25 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Corrections
- Correctifs de sécurité Node.js et Next.js : avant, le front tournait sur Node 24.21.0 et Next.js 16.3.8 ; maintenant, Node 24.22.1 (image Docker et CI) et Next.js 16.4.2 (avec eslint-config-next). (sans clé Jira, [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))

#### Changements de comportement
- L'onglet Sessions de la console affiche désormais le `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; mêmes états chargement / vide / indisponible que le front Settings) au lieu du tableau local, supprimé avec `administration-session-state.ts`. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La navigation (barre latérale repliable, barre supérieure, pied de page) vient désormais de `AccessibleShell` de `@mairie360/lib-components/shell` ; les composants locaux `accessible-shell`, `desktop-navigation` et `sidebar-preference` sont supprimés. La navigation reste inerte pendant qu'une confirmation `alertdialog` est ouverte. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les onglets de la console ont des identifiants `administration-tab-<clé>`, ce qui casse tout sélecteur ou test qui visait les anciens identifiants. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Réorganisation des composants d'administration en un dossier par composant sous `src/components/AdministrationPage/`, tests co-localisés et contrôle par `tests/component-tree-convention.test.cjs` (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218)).
- La PR #218 est en brouillon : elle attend la publication de la version majeure de lib-components, et les vérifications « lib installée = version épinglée » échouent volontairement jusque-là.

## Différence dev → staging (en dev, pas encore en staging)

#### Corrections
- Correctifs de sécurité Node.js et Next.js : avant, le front tournait sur Node 24.21.0 et Next.js 16.3.8 ; maintenant, Node 24.22.1 (image Docker et CI) et Next.js 16.4.2 (avec eslint-config-next). (sans clé Jira, [#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))

#### Changements de comportement
- L'onglet Sessions de la console affiche désormais le `SessionList` de la lib (colonnes appareil, IP, création, expiration, état ; mêmes états chargement / vide / indisponible que le front Settings) au lieu du tableau local, supprimé avec `administration-session-state.ts`. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La navigation (barre latérale repliable, barre supérieure, pied de page) vient désormais de `AccessibleShell` de `@mairie360/lib-components/shell` ; les composants locaux `accessible-shell`, `desktop-navigation` et `sidebar-preference` sont supprimés. La navigation reste inerte pendant qu'une confirmation `alertdialog` est ouverte. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les onglets de la console ont des identifiants `administration-tab-<clé>`, ce qui casse tout sélecteur ou test qui visait les anciens identifiants. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Réorganisation des composants d'administration en un dossier par composant sous `src/components/AdministrationPage/`, tests co-localisés et contrôle par `tests/component-tree-convention.test.cjs` (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218)).
- La PR #218 est en brouillon : elle attend la publication de la version majeure de lib-components, et les vérifications « lib installée = version épinglée » échouent volontairement jusque-là.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
