# Journal des releases — Administrator_Web_Service

<!-- release-journal-state {"dev": "2daa38f497488c7e3cee0477549d0d98cd8c4716", "prod": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "prod_tag": "v1.2.0", "staging": "bea8f87c96d62cd5c2b1ad0ffcc9cb7f37f30c21", "updated": {"dev": "2026-11-04 18:19 UTC", "prod": "2026-10-21 11:08 UTC", "staging": "2026-10-21 11:00 UTC"}} -->
> Tenu à jour par la CI (`mairie360/CICD`, action `release/release-journal`) à chaque passage en dev, staging et prod. Ne pas modifier à la main : le fichier est réécrit au passage suivant.

| Environnement | Version | Commit | Mis à jour |
| --- | --- | --- | --- |
| prod | v1.2.0 | `bea8f87` | 2026-10-21 11:08 UTC |
| staging | — | `bea8f87` | 2026-10-21 11:00 UTC |
| dev | — | `2daa38f` | 2026-11-04 18:19 UTC |

## Ajouté sur main depuis la dernière release prod (v1.2.0)

#### Changements de comportement
- Le shell de l'application (barre latérale repliable, barre supérieure, pied de page) vient désormais de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-578, MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions de la console affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement, vide et indisponible, au lieu de la table locale. `src/lib/administration-session-state.ts` est supprimé. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les onglets de la console portent les ids `administration-tab-<clé>` (composant `Tabs` de la lib). Un test ou un script externe qui cible les onglets doit viser ces ids.
- Titres de page, boutons (Créer, Enregistrer, Annuler, Modifier, Supprimer, Actualiser, Réessayer), alertes, notifications Toast (selon le ton) et états de chargement sont désormais les composants normalisés de la lib : l'apparence change. Le commit est marqué `feat!`, changement cassant pour la maquette. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Mise à jour de Node.js de 24.21.0 à 24.22.1 (Dockerfile, CI, contrats) et de Next.js de 16.3.8 à 16.4.2, correctif de sécurité, avec nouveau digest d'image Node. ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Sécurité des dépendances : zod remplacé par un backport vendored (3.25.76+mairie360.1) avec vérification d'intégrité lancée en `postinstall`, `prebuild` et `pretest` ; `follow-redirects` passé à 1.16.2 (GHSA-mrwp-f3q8-3g9p). (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236), [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Preuve de bundle par source maps (`test:bundle`, émises seulement par la mesure CI) et alerte ZAP 10031 sur les onglets de `/?tab=…` classée hors périmètre dans `.zap/rules.tsv`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Épinglage de mairie360/CICD : v5.1.0 (stack RGAA), v5.2.2 (contrôles RGPD), v5.3.0 puis v5.3.1 ; Renovate met à jour `gdpr-pr.yml` par tag. (MAIR-316, MAIR-771, MAIR-497, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238), [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241), [#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- Stack RGAA d'accessibilité (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) avec verrou de run, rapport vidé à chaque run et délais bornés sur les attentes de santé. (MAIR-316, MAIR-768, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Simulation d'usage RGPD (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`) : stack de test sans port publié, nettoyage des logs et des volumes. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Checklist RGPD obligatoire sur chaque PR (section « Données personnelles » à remplir, « Oui » exige l'inventaire) et Renovate sur le tag CICD de `gdpr-pr.yml`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Tests de politique et de structure (`tests/component-tree-convention.test.cjs`, tests de pin CICD, vitest co-localisé) et réorganisation des composants d'administration en dossiers par composant. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence dev → staging (en dev, pas encore en staging)

#### Changements de comportement
- Le shell de l'application (barre latérale repliable, barre supérieure, pied de page) vient désormais de `@mairie360/lib-components/shell`. Les fichiers locaux `accessible-shell.tsx`, `desktop-navigation.tsx` et `sidebar-preference.ts` sont supprimés. (MAIR-578, MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- L'onglet Sessions de la console affiche le `SessionList` de la lib, avec les mêmes colonnes (appareil, IP, création, expiration, état) et les mêmes états chargement, vide et indisponible, au lieu de la table locale. `src/lib/administration-session-state.ts` est supprimé. (MAIR-607, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))
- Les onglets de la console portent les ids `administration-tab-<clé>` (composant `Tabs` de la lib). Un test ou un script externe qui cible les onglets doit viser ces ids.
- Titres de page, boutons (Créer, Enregistrer, Annuler, Modifier, Supprimer, Actualiser, Réessayer), alertes, notifications Toast (selon le ton) et états de chargement sont désormais les composants normalisés de la lib : l'apparence change. Le commit est marqué `feat!`, changement cassant pour la maquette. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

#### Technique
- Mise à jour de Node.js de 24.21.0 à 24.22.1 (Dockerfile, CI, contrats) et de Next.js de 16.3.8 à 16.4.2, correctif de sécurité, avec nouveau digest d'image Node. ([#227](https://github.com/mairie360/Administrator_Web_Service/pull/227))
- Sécurité des dépendances : zod remplacé par un backport vendored (3.25.76+mairie360.1) avec vérification d'intégrité lancée en `postinstall`, `prebuild` et `pretest` ; `follow-redirects` passé à 1.16.2 (GHSA-mrwp-f3q8-3g9p). (MAIR-770, [#236](https://github.com/mairie360/Administrator_Web_Service/pull/236), [#234](https://github.com/mairie360/Administrator_Web_Service/pull/234))
- Preuve de bundle par source maps (`test:bundle`, émises seulement par la mesure CI) et alerte ZAP 10031 sur les onglets de `/?tab=…` classée hors périmètre dans `.zap/rules.tsv`. ([#236](https://github.com/mairie360/Administrator_Web_Service/pull/236))
- Épinglage de mairie360/CICD : v5.1.0 (stack RGAA), v5.2.2 (contrôles RGPD), v5.3.0 puis v5.3.1 ; Renovate met à jour `gdpr-pr.yml` par tag. (MAIR-316, MAIR-771, MAIR-497, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#238](https://github.com/mairie360/Administrator_Web_Service/pull/238), [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241), [#226](https://github.com/mairie360/Administrator_Web_Service/pull/226))
- Stack RGAA d'accessibilité (`accessibility_test.sh`, `docker-compose-accessibility.yml`, `rgaa.yaml`) avec verrou de run, rapport vidé à chaque run et délais bornés sur les attentes de santé. (MAIR-316, MAIR-768, [#153](https://github.com/mairie360/Administrator_Web_Service/pull/153), [#232](https://github.com/mairie360/Administrator_Web_Service/pull/232))
- Simulation d'usage RGPD (`gdpr_simulation_test.sh`, `docker-compose-gdpr-simulation.yml`, `gdpr-simulation.yaml`) : stack de test sans port publié, nettoyage des logs et des volumes. (MAIR-497, [#240](https://github.com/mairie360/Administrator_Web_Service/pull/240), [#241](https://github.com/mairie360/Administrator_Web_Service/pull/241))
- Checklist RGPD obligatoire sur chaque PR (section « Données personnelles » à remplir, « Oui » exige l'inventaire) et Renovate sur le tag CICD de `gdpr-pr.yml`. (MAIR-295, [#158](https://github.com/mairie360/Administrator_Web_Service/pull/158))
- Tests de politique et de structure (`tests/component-tree-convention.test.cjs`, tests de pin CICD, vitest co-localisé) et réorganisation des composants d'administration en dossiers par composant. (MAIR-608, [#218](https://github.com/mairie360/Administrator_Web_Service/pull/218))

## Différence staging → prod (en staging, pas encore en prod)

_Rien._

## Historique des passages

<!-- release-journal-history:start -->
| Date | Environnement | Version | Commit | Run |
| --- | --- | --- | --- | --- |
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
