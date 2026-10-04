# Administrator_Web_Service

Host the Mairie360 administration interface: navigation, session context and the shared administration component. The service exposes BFF User routes at the same origin as the interface.

Héberger l’interface d’administration de Mairie360: navigation, contexte de session et composant d’administration partagé. Le service expose les routes de BFF User à la même origine que l’interface.

## Documentation

| Language / Langue | Module | Technical / Technique |
| --- | --- | --- |
| English | [Module overview](docs/en/module.md) | [Technical documentation](docs/en/technical.md) |
| Français | [Présentation du module](docs/fr/module.md) | [Documentation technique](docs/fr/technical.md) |

The guides describe the implemented module, its current limitations, local setup, routes, data, verification and CI/CD.

Les guides décrivent le module implémenté, ses limites actuelles, le démarrage local, les routes, les données, les vérifications et la CI/CD.

## Confirmed role deletion / Suppression confirmée d’un rôle

The role list applies a deletion only after the existing BFF operation succeeds, even when the following GET fails. Older reads cannot restore the deleted role; the warning retries only the GET. Pending/refused deletion retains the role, confirmation dialog and edit draft. Confirmation clears only an editor for that deleted role, never an unrelated create draft. No API/BFF, client, contract, dependency or authentication behavior changes. Regression tests: `node --test tests/administration-role-confirmation.bff-mock.test.cjs`.

La liste reflète la suppression uniquement après confirmation du BFF existant, même si le GET suivant échoue. Une lecture ancienne ne réintroduit pas le rôle ; la reprise ne renvoie que le GET. Attente/refus conservent le rôle, la confirmation et le brouillon. Seul l’éditeur du rôle supprimé est réinitialisé, jamais un autre brouillon. Aucun changement API/BFF, client, contrat, dépendance ou authentification.

## Confirmed group deletion / Suppression de groupe confirmée

[MAIR-465](https://mairie-360.atlassian.net/browse/MAIR-465) / [issue #139](https://github.com/mairie360/Administrator_Web_Service/issues/139): after the existing DELETE succeeds, the frontend removes only that known group immediately. Older global list and deleted-group detail replies cannot restore it. The deleted selection is cleared, while independent creation and other-group drafts remain intact. Pending or refused DELETE leaves the group, draft and confirmation unchanged; the existing synchronous action guard prevents duplicate pending writes. A failed follow-up read offers GET-only recovery, never a repeat of a confirmed DELETE.

Après confirmation du DELETE existant, seul le groupe concerné est retiré immédiatement. Les anciennes lectures ne peuvent pas le restaurer ou rouvrir sa fiche ; les brouillons indépendants sont conservés. Une suppression en attente ou refusée conserve le groupe et la confirmation. La reprise d’une actualisation échouée effectue uniquement GET.

Verification: `node --test tests/administration-group-deletion.bff-mock.test.cjs` covers seven real-component/route/contract cases, including delayed reads and selection ownership. Isolated Next production/browser QA at 1280×720 and 390×844 exercised confirmed deletion + GET503, refused DELETE403 + explicit retry, draft retention and GET-only recovery: 16 GET and three DELETE requests (one confirmed group1, one refused then one confirmed group2), no POST/contract violations or relevant browser console errors. Fixtures are disposable and in memory only; this does not certify deployed authorization, deletion of real data or remote CI/integration. No API/BFF, client/contract, authentication, dependencies, deployment pins or product demo data changed.

## Contracts and background / Contrats et compléments

- [BFF.md](BFF.md)
- [BACKEND.md](BACKEND.md)
- [contracts/openapi.json](contracts/openapi.json)

`BACKEND.md`, when present, includes proposed backend requirements; use the guides and versioned OpenAPI contract to identify current behavior.

`BACKEND.md`, lorsqu’il est présent, contient des besoins backend proposés; consulter les guides et le contrat OpenAPI versionné pour identifier le comportement actuel.

## Required security check compatibility / Compatibilité du contrôle de sécurité requis

For [MAIR-230](https://mairie-360.atlassian.net/browse/MAIR-230) and [issue #123](https://github.com/mairie360/Administrator_Web_Service/issues/123), the consumer workflow executes **both** Semgrep and redacted Gitleaks under the required legacy name `CICD / Code Security Audit (Semgrep)`. The scanner actions use the reviewed, published CICD v4.0.1 commit `539847726d4058a9565c4f682c2d1d8302874b06`, alongside the unchanged shared frontend workflow v4.0.2. The additional job has read-only repository permissions, checks out full history without persisting credentials, and fails on findings or scanner errors. It does not replace scans with a synthetic success or alter branch protection.

Pour MAIR-230 et l’issue #123, le workflow consommateur exécute **Semgrep et Gitleaks** (secrets expurgés) sous le nom historique requis `CICD / Code Security Audit (Semgrep)`. Les actions de scan utilisent le commit publié et vérifié de CICD v4.0.1 ci-dessus, sans remplacer le workflow frontend partagé v4.0.2. Ce job supplémentaire n’a que la lecture du dépôt, récupère l’historique complet sans conserver les credentials, et échoue sur les findings ou erreurs de scan. Aucun succès artificiel ni changement de protection de branche.

## Frontend image packaging / Packaging de l’image frontend

[MAIR-436](https://mairie-360.atlassian.net/browse/MAIR-436) / [issue #125](https://github.com/mairie360/Administrator_Web_Service/issues/125): Docker and both frontend workflows use Node **24.21.0 LTS**. The official Bookworm slim image is pinned to `sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6`. Dependency installation requires the existing BuildKit secret `node_auth_token` from `NODE_AUTH_TOKEN`, only during `npm ci`; the tracked npm policy is mounted read-only, including its seven-day release-age rule and existing internal UI exception. Do not pass credentials with `--build-arg` or store them in the image. The standalone non-root runner retains Node/curl, without unused global npm/npx/yarn/corepack.

Docker et les deux workflows frontend utilisent Node **24.21.0 LTS** et l’image officielle épinglée ci-dessus. Le secret BuildKit existant est requis uniquement pendant `npm ci`, avec la politique npm suivie en lecture seule. Les trois fichiers Compose transmettent `NODE_AUTH_TOKEN` au **seul build frontend** via `secrets`, sans modifier les autres services, les environnements runtime, les réseaux, healthchecks ou scanners. Aucun API/BFF, droit nouveau, pin de cluster ni approbation Staging/Prod. Tests de politique : `node --test tests/ci-policy.test.cjs`. Le ticket global MAIR-436 reste distinct de cette tranche : les critères permissions/push et les autres fronts ne sont pas certifiés par ce correctif.

## Confirmed group membership / Membres confirmés d’un groupe

[MAIR-463](https://mairie-360.atlassian.net/browse/MAIR-463): apply an addition/removal to the selected group's list only after the existing BFF operation confirms it. Pending or refused writes keep the previous members. A failed readback does not undo confirmation or permit repeating the write through the refresh retry; retry is GET-only. Saved refresh callbacks belong to their original selection and cannot replace another group's members or draft. Superseded reads and reads settling after unmount are ignored.

Les ajouts/retraits confirmés restent affichés même si la relecture échoue ; aucune adhésion n’est inventée pendant l’attente ou après un refus. Les données proviennent des utilisateurs existants du BFF, sans fixture produit. La reprise ne répète jamais l’écriture et une ancienne sélection ne remplace ni les membres ni le brouillon de la fiche actuelle. Tests des composants réels et du contrat : `node --test tests/administration-members-html.bff-mock.test.cjs`.

Only the frontend console changes. No API/BFF, client/contract, authorization, dependency, security policy, environment deployment or cluster pin change. Isolated HTTP recipes validate presentation and request sequencing, not deployed authorization or persistence. Completion still requires green CI, integration and a refreshed `local-current` snapshot.

## Combined confirmation regression / Non-régression des confirmations combinées

The candidate combines [PR #136](https://github.com/mairie360/Administrator_Web_Service/pull/136) (MAIR-463), [PR #138](https://github.com/mairie360/Administrator_Web_Service/pull/138) (MAIR-464), and [PR #140](https://github.com/mairie360/Administrator_Web_Service/pull/140) (MAIR-465). Their group-selection conflict is resolved by retaining both detail-request ownership and membership-read revisions. The added real-component/contract test confirms a member addition, deletes that same group, retries the failed group-list read without repeating either write, and opens a second group without leaking the previous members or overwriting its draft. The three targeted suites pass 20 cases; the full sequential Node coverage suite, TypeScript, contract check, lint (two existing warnings) and isolated one-worker production build also pass locally.

Native in-app browser QA at 1280×720 exercised the combined build: confirmed member POST followed by GET503, confirmed group DELETE followed by GET503 and GET-only recovery, then confirmed role DELETE followed by GET503 and GET-only recovery. Independent create drafts survived; the deleted group/role stayed absent and the second group's members stayed independent. The isolated ledger contains 17 GET, one member POST, one group DELETE and one role DELETE, with no contract violations or relevant console warnings/errors. Test data and the ledger stay outside product sources; no real user data or deployed BFF was used.

Cette composition conserve les deux protections de sélection et de lecture après résolution du conflit. La recette combinée prouve la conservation des confirmations et des brouillons, sans répétition d'écriture ni fuite de membres vers le groupe suivant. Elle ne constitue pas une validation mobile de cette composition, un contrôle d'autorisation/persistance déployée, ni une certification exhaustive du prototype. La livraison reste ouverte tant que la CI réelle n'est pas verte, les changements non intégrés dans `main` et le snapshot `local-current` non rafraîchi. Aucun API/BFF, client, contrat, dépendance, politique de sécurité ou déploiement n'est modifié.
## Confirmed user actions / Actions utilisateurs confirmées

[MAIR-453](https://mairie-360.atlassian.net/browse/MAIR-453): a refused users read retains the last received rows and offers a dedicated GET-only retry using the current search/page. A confirmed create closes its form without inventing a user row; a confirmed delete removes only that user's row and closes its editor. Until server readback succeeds, totals and pagination are explicitly stale. Refused writes retain the draft/confirmation; older reads cannot resurrect a confirmed deletion. No API/BFF, generated client, contract, authentication or demonstration data changes.

Une lecture refusée conserve les dernières lignes reçues et propose une reprise GET seule avec les critères actuels. Une création confirmée ferme son formulaire sans fabriquer de compte ; une suppression confirmée retire seulement sa ligne et ferme sa fiche. Totaux et pagination attendent la relecture serveur. Une écriture refusée conserve le brouillon/la confirmation ; une ancienne lecture ne rétablit pas le compte supprimé. Régressions : `node --test tests/administration-page-html.bff-mock.test.cjs`.
