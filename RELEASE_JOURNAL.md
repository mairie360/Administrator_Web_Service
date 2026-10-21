# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "eab10e0eb7921da434355f6972ab26447203fa18", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-10-21 18:00 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `eab10e0` | 2026-10-21 18:00 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- Les onglets de la console d'administration portent désormais les ids `administration-tab-<key>` et sont rendus par le composant `Tabs` de la lib normalisée ; l'en-tête utilise `PageHeader`, le sélecteur de vue `SegmentedControl`, les notifications `Toast` par ton, et les boutons reprennent les presets `Create`, `Save`, `Cancel`, `Edit`, `Delete`, `Refresh`, `Retry`. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement / vide / indisponible que le front Settings ; le tableau local et `src/lib/administration-session-state.ts` sont supprimés. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La navigation (barre latérale réductible, barre supérieure, pied de page) vient de `AccessibleShell` de la lib ; la barre latérale locale et la préférence `sidebar-preference` sont supprimées, et le shell reste inerte pendant une confirmation `alertdialog`. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Changement annoncé comme cassant (`feat!`) : passage à la lib normalisée, dont la version majeure n'est pas encore épinglée dans ce dépôt. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Les composants de l'administration sont réorganisés en un dossier par composant sous `src/components/AdministrationPage/`, avec `index.ts`, `Name.tsx` et `Name.test.tsx` co-localisé, contrôlé par `tests/component-tree-convention.test.cjs` ; `npm test` lance aussi `test:components` (vitest + jsdom).
- Documentation (CLAUDE.md, README) mise à jour avec la maquette Figma de référence, et tests de page et fixtures `shared-ui-releases.json` ajoutés ou ajustés.

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Les onglets de la console d'administration portent désormais les ids `administration-tab-<key>` et sont rendus par le composant `Tabs` de la lib normalisée ; l'en-tête utilise `PageHeader`, le sélecteur de vue `SegmentedControl`, les notifications `Toast` par ton, et les boutons reprennent les presets `Create`, `Save`, `Cancel`, `Edit`, `Delete`, `Refresh`, `Retry`. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement / vide / indisponible que le front Settings ; le tableau local et `src/lib/administration-session-state.ts` sont supprimés. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- La navigation (barre latérale réductible, barre supérieure, pied de page) vient de `AccessibleShell` de la lib ; la barre latérale locale et la préférence `sidebar-preference` sont supprimées, et le shell reste inerte pendant une confirmation `alertdialog`. (MAIR-578, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Changement annoncé comme cassant (`feat!`) : passage à la lib normalisée, dont la version majeure n'est pas encore épinglée dans ce dépôt. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Les composants de l'administration sont réorganisés en un dossier par composant sous `src/components/AdministrationPage/`, avec `index.ts`, `Name.tsx` et `Name.test.tsx` co-localisé, contrôlé par `tests/component-tree-convention.test.cjs` ; `npm test` lance aussi `test:components` (vitest + jsdom).
- Documentation (CLAUDE.md, README) mise à jour avec la maquette Figma de référence, et tests de page et fixtures `shared-ui-releases.json` ajoutés ou ajustés.

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
