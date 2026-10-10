# Administrator_Web_Service

## Current shared UI artifact — 10 October 2026

This frontend consumes the published `@mairie360/lib-components@0.6.12` artifact from source commit `6c022cb53da535fd16d4fa80a5cdb943d3791f31`. The selected manifest version, root lock entry, installed package, registry integrity and recorded distribution hashes are checked together by the release tests. Application pins and published BFF contracts are unchanged by this documentation update. Historical 0.6.11 notes below describe the earlier delivery.

## Published shared library — 9 October 2026

The earlier delivery pinned the real `@mairie360/lib-components@0.6.11` artifact published from library main `f2433185c5f52125698428b2610701a834efccf4`. Registry integrity and downloaded distribution files were verified. Only the exact UI pin and its root/package lock entries change; other dependencies, published BFF contracts, layouts, security and RGAA controls remain unchanged. Cross-consumer tests and browser evidence are recorded separately from main/dev delivery.

Dependency selection uses verified immutable registry metadata because npm 11.15 rejects the fresh release under the existing seven-day chooser and warns that its existing internal UI exclusion key is unsupported. Configuration remains unchanged; a normal locked installation must verify this candidate.

Ce front utilise le paquet réellement publié 0.6.11. Le verrou reprend les métadonnées et l’intégrité vérifiées du registre, sans changer les autres dépendances, la politique sept jours ou les contrats publiés. Installation, contrôles du consommateur, intégration main, snapshot et recette dev restent des étapes distinctes.


## Runtime maintenance / Maintenance des dépendances — 8 October 2026

Next and eslint-config-next are pinned to `16.3.8`; the existing scoped
image runtime resolves sharp `0.35.5` and source-map-js `1.2.2`. The public
seven-day release policy, published BFF contract and shared UI pins are
retained. The full blocking audit remains required; braces is independently
unresolved. Candidate changes require their own checks and protected main
integration before delivery is declared complete.

Next et eslint-config-next sont épinglés à `16.3.8` ; le moteur d’images
ciblé utilise sharp `0.35.5`, et source-map-js est verrouillé à `1.2.2`.
Le délai public de sept jours, les contrats BFF publiés et les versions de
l’UI sont conservés. L’audit bloquant reste requis ; braces demeure un
blocage indépendant. Les vérifications du candidat et son intégration
protégée sur main restent nécessaires avant de déclarer la livraison.

## Independent console panels / Panneaux indépendants — MAIR-406

[Issue #146](https://github.com/mairie360/Administrator_Web_Service/issues/146)
tracks the design-only split requested by the existing audit. The console now
owns orchestration; users, roles, groups and sessions live in separate top-level
components under `src/components/administration/`. Shared controls and the
confirmation dialog have explicit imports, without a barrel or circular
dependency. The twelve existing function bodies and parameters are preserved.
An HTTP/HTML regression checks that console refresh keeps each active panel's
drafts and the selected session-history view, without writing business data.

La console orchestre les quatre panneaux séparés utilisateurs/rôles/groupes/
sessions. Champs, boutons et confirmations sont partagés sans dépendance aux
données. Les mêmes fonctions, callbacks, état, classes, lectures et mutations
sont conservés ; ce découpage ne corrige ni ne certifie les commandes par token,
les droits déployés ou l'authentification réelle. Aucun API/BFF, client réseau,
contrat, dépendance, workflow, environnement ou pin n'est modifié. L'intégration
et la CI verte restent des critères distincts, pas une conséquence du refactoring.

## Protected document recovery / Reprise de navigation — MAIR-406

[Issue #145](https://github.com/mairie360/Administrator_Web_Service/issues/145)
tracks this navigation slice separately from stored-token and profile visibility.

The data client handles an actual opaque redirect by reopening the current
protected document once. The existing middleware then owns Login and the page's
return path/query, rather than a data endpoint. It never reads the opaque
destination or body, follows it through fetch, or resubmits a mutation. An
aborted response causes no navigation. Ordinary 401/403/503 and network failures
keep their existing handling; this is not a new logout or authorization policy.

Le client distingue une redirection opaque d'une panne ou d'un refus métier.
Il recharge une seule fois le document protégé pour laisser le middleware gérer
Login et le retour vers la page. Aucune écriture n'est répétée automatiquement.
La recette utilise un cookie d'expiration synthétique et une destination Login
explicitement marquée QA : elle ne certifie pas l'authentification déployée.

Regression: `node --test --test-concurrency=1 tests/bff-client.bff-mock.test.cjs`.
Four new assertions fail before the fix and pass afterwards; two guards preserve
ordinary errors. Routes, session hook, middleware, proxy, published User0.5.0,
API/BFF, security policy, dependencies and deployment remain unchanged.
The complete sequential suite passes 234 tests/16 suites with unchanged 60%
coverage gates, followed by TypeScript, contract check, lint (two inherited
warnings) and an isolated one-worker production build. Native 1280×720 QA
reproduces the old search failure, then observes one protected-document redirect
to the labelled Login QA landing with the correct page return path/query.
Ordinary 403/503 remain distinct and recover through GET-only retry: 28 fixture
reads, zero writes and zero contract violations. The requested mobile override
remained measured at 1280×720 in both tabs, so mobile is not certified here.
MAIR-406 remains a mixed, open audit until its other criteria and integration pass.

## Profile-gated console / Console conditionnée au profil — MAIR-406

[Issue #144](https://github.com/mairie360/Administrator_Web_Service/issues/144)
tracks this page-rendering slice separately from stored-token issue #142.

The page mounts the administration console only after the existing profile hook
resolves an Admin session. Pending profiles show a loading status; other resolved
roles see an access-reserved message without starting administration reads. A
profile error has its own unavailable state and document-reload retry, not a
false role denial. The existing 401 logout behavior and shared shell remain.

La console attend le profil administrateur. Responsable, Maire, User et Guest
conservent la navigation mais ne chargent ni tableaux ni actions Administration.
Une erreur de profil propose « Réessayer » sans écriture métier. Le prototype
conservé décrit cet accès réservé dans son README mais sa page montait elle aussi
la console sans condition : ce défaut n'est pas recopié. Ce contrôle d'affichage
ne remplace pas l'autorisation serveur et ne clôt pas l'audit mixte MAIR-406.

Regression: `node --test tests/administration-page-html.bff-mock.test.cjs`.
No API/BFF, session hook, middleware, proxy, contract, dependency, environment or
product fixture changes. Error fixtures are explicitly outside the package's
published success schemas; native local QA is not a deployed authorization proof.

## Cookie-owned data requests / Requêtes liées au cookie — MAIR-406

The frontend data client no longer reads or migrates `mairie360.auth.jwt` or
`mairie360.projects.jwt` to inject an Authorization header. The existing proxy
uses the session cookie; explicitly supplied caller headers remain unchanged.
Storage cleanup helpers, routes, middleware and session adapters are unchanged.
This does not validate a cookie signature or grant administrator rights.

Le client de données n'utilise plus les anciens jetons du navigateur pour
remplacer la session du cookie. Aucune donnée du stockage utilisateur n'est
effacée ou migrée pendant une lecture. Les headers explicites sont conservés.
La révocation par identifiant reste un sujet distinct non terminé ; la reprise
de navigation et l'affichage non-admin sont traités séparément ci-dessus, sans
revendiquer l'intégration ni les droits déployés.

Regression: `node --test tests/bff-client.bff-mock.test.cjs tests/administration-api.bff-mock.test.cjs`.
Four assertions fail before the correction and pass afterwards through the real
frontend routes/proxy and contract-driven HTTP fixtures. These are not native
browser storage or deployed authorization proofs. No API/BFF, contract, package,
security policy or deployment change; no demonstration data is shipped.

## Reference sidebar / Sidebar de référence — MAIR-180

[Issue #141](https://github.com/mairie360/Administrator_Web_Service/issues/141)
tracks consumer CSS restoring measured 44px navigation targets and the reference
shadow while keeping mobile Close reachable. The published red Administration
marker, console data and shared AppShell behavior are unchanged. Scoped CSS and
`tests/administration-typography.test.cjs` only; native desktop/mobile checks are
required in addition to structural tests. No API/BFF or demo data is changed.

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

## Historical token-form verification / Vérification historique du formulaire à jeton

Additional verification, 6 October 2026 — MAIR-460 / MAIR-470: targeted session
readback now waits for both existing parallel GETs, applies each successful list
independently and preserves the refused source. A fast failure no longer unlocks
the confirmed command's form while the other read is pending. Four added
real-component/HTTP regressions failed on `a511e97` and pass after this correction.
The preserved prototype has the same `Promise.all` defect; its files are unchanged.

The full sequential Node suite passes 250 tests / 16 suites with unchanged 60%
coverage gates (97.92% lines, 93.58% branches, 90.97% functions). TypeScript,
published User0.5.0 snapshot check and lint pass (two existing warnings). Production
webpack build passes with a temporary one-worker limit and 768 MB heap; the config
is restored before publication. Existing dependencies were reused, not freshly
installed. Native integrated-browser QA: 1280×720 and actual 390×844, independent
success/refusal in both directions, desktop refresh and mobile revoke with an
8001/8003 ms history read after active GET503, locked field/commands throughout,
confirmed clearing, distinct readback warning and GET-only retry. Ledger: 24 GET,
one refresh POST200 and one revoke POST204, zero validation violations within the
declared synthetic 503 error-schema exceptions; no console errors/warnings,
framework overlay or external horizontal overflow observed. Fixtures/screenshots
stay outside Git. No real token, authentication, revocation or deployment is proved.
The final recipe uses a string role description; the first recipe's ancillary
null-description role fixture was excluded and all target interactions rerun.
The disposable helper and frontend child are stopped; CI/main integration and an
exact refreshed local-current remain required before closure.

Complément du 6 octobre : les deux sources gardent leur succès indépendant et le
verrou existant reste actif jusqu’à leur fin. Reprise GET seule sans rejouer de
commande, aucune donnée QA publiée. Le SDK/client/proxy/authentification, les
API/BFF, dépendances, workflows, protections de main, contrôles sécurité/RGAA et
déploiements restent inchangés. Les autres recettes ci-dessous sont historiques
et gardent leur périmètre ; elles ne remplacent pas cette nouvelle vérification.

[MAIR-460](https://mairie-360.atlassian.net/browse/MAIR-460) / [issue #132](https://github.com/mairie360/Administrator_Web_Service/issues/132): the token input and both refresh/revoke commands are locked while the existing action and readback are pending. Rejected writes retain the local draft; confirmed writes clear it, including when readback fails. The existing readback warning/retry remains GET-only, and the console's synchronous action guard still prevents competing mutations before React commits.

Five real-component/published-contract regressions cover both commands, deferred write/readback, same-tick duplicate/competing callbacks, refusal, explicit retry, confirmation followed by failed readback, and empty input. The full Node suite passes 183 tests. TypeScript and contract checks pass; lint has no errors and two pre-existing effect warnings outside this form. An isolated production webpack build passes with one worker and a 768 MB heap, using existing dependencies. Native integrated-browser QA at 1280×720 and 390×844 verifies pending locks, confirmed clearing, refused draft retention, active/history views and GET-only recovery against disposable in-memory contract fixtures. The mobile document stays 390 px wide; session tables retain their own horizontal scrolling. No runtime overlay or relevant console error was observed. This is frontend QA, not proof of real session revocation, backend authorization or deployment. CI/integration and exact-main snapshot refresh remain prerequisites for closure.

Seuls le composant frontend, ses tests et cette documentation changent. Aucun API/BFF, contrat, client/proxy, authentification, permission, dépendance, workflow ou pin de déploiement n’est modifié. Les valeurs QA sont générées et jetables, sans credentials réels ni données de démonstration ajoutées au produit. Le verrou est dérivé de l’état existant, sans nouvel effet, stockage ou requête.

## Frontend image packaging / Packaging de l’image frontend

[MAIR-436](https://mairie-360.atlassian.net/browse/MAIR-436) / [issue #125](https://github.com/mairie360/Administrator_Web_Service/issues/125): Docker and both frontend workflows use Node **24.21.0 LTS**. The official Bookworm slim image is pinned to `sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6`. Dependency installation requires the existing BuildKit secret `node_auth_token` from `NODE_AUTH_TOKEN`, only during `npm ci`; the tracked npm policy is mounted read-only, including its seven-day release-age rule and existing internal UI exception. Do not pass credentials with `--build-arg` or store them in the image. The standalone non-root runner retains Node/curl, without unused global npm/npx/yarn/corepack.

Docker et les deux workflows frontend utilisent Node **24.21.0 LTS** et l’image officielle épinglée ci-dessus. Le secret BuildKit existant est requis uniquement pendant `npm ci`, avec la politique npm suivie en lecture seule. Les trois fichiers Compose transmettent `NODE_AUTH_TOKEN` au **seul build frontend** via `secrets`, sans modifier les autres services, les environnements runtime, les réseaux, healthchecks ou scanners. Aucun API/BFF, droit nouveau, pin de cluster ni approbation Staging/Prod. Tests de politique : `node --test tests/ci-policy.test.cjs`. Le ticket global MAIR-436 reste distinct de cette tranche : les critères permissions/push et les autres fronts ne sont pas certifiés par ce correctif.

## Confirmed group membership / Membres confirmés d’un groupe

[MAIR-463](https://mairie-360.atlassian.net/browse/MAIR-463): apply an addition/removal to the selected group's list only after the existing BFF operation confirms it. Pending or refused writes keep the previous members. A failed readback does not undo confirmation or permit repeating the write through the refresh retry; retry is GET-only. Saved refresh callbacks belong to their original selection and cannot replace another group's members or draft. Superseded reads and reads settling after unmount are ignored.

Les ajouts/retraits confirmés restent affichés même si la relecture échoue ; aucune adhésion n’est inventée pendant l’attente ou après un refus. Les données proviennent des utilisateurs existants du BFF, sans fixture produit. La reprise ne répète jamais l’écriture et une ancienne sélection ne remplace ni les membres ni le brouillon de la fiche actuelle. Tests des composants réels et du contrat : `node --test tests/administration-members-html.bff-mock.test.cjs`.

Only the frontend console changes. No API/BFF, client/contract, authorization, dependency, security policy, environment deployment or cluster pin change. Isolated HTTP recipes validate presentation and request sequencing, not deployed authorization or persistence. Completion still requires green CI, integration and a refreshed `local-current` snapshot.

## Earlier combined confirmation regression / Première non-régression des confirmations combinées

The candidate combines [PR #136](https://github.com/mairie360/Administrator_Web_Service/pull/136) (MAIR-463), [PR #138](https://github.com/mairie360/Administrator_Web_Service/pull/138) (MAIR-464), and [PR #140](https://github.com/mairie360/Administrator_Web_Service/pull/140) (MAIR-465). Their group-selection conflict is resolved by retaining both detail-request ownership and membership-read revisions. The added real-component/contract test confirms a member addition, deletes that same group, retries the failed group-list read without repeating either write, and opens a second group without leaking the previous members or overwriting its draft. The three targeted suites pass 20 cases; the full sequential Node coverage suite, TypeScript, contract check, lint (two existing warnings) and isolated one-worker production build also pass locally.

Native in-app browser QA at 1280×720 exercised the combined build: confirmed member POST followed by GET503, confirmed group DELETE followed by GET503 and GET-only recovery, then confirmed role DELETE followed by GET503 and GET-only recovery. Independent create drafts survived; the deleted group/role stayed absent and the second group's members stayed independent. The isolated ledger contains 17 GET, one member POST, one group DELETE and one role DELETE, with no contract violations or relevant console warnings/errors. Test data and the ledger stay outside product sources; no real user data or deployed BFF was used.

Cette première composition conserve les deux protections de sélection et de lecture après résolution du conflit. La recette combinée prouve la conservation des confirmations et des brouillons, sans répétition d'écriture ni fuite de membres vers le groupe suivant. Elle ne constitue pas une validation mobile de ce premier candidat, un contrôle d'autorisation/persistance déployée, ni une certification exhaustive du prototype. La livraison reste ouverte tant que la CI réelle n'est pas verte, les changements non intégrés dans `main` et le snapshot `local-current` non rafraîchi. Aucun API/BFF, client, contrat, dépendance, politique de sécurité ou déploiement n'était modifié dans cette première tranche.

## Confirmed user actions / Actions utilisateurs confirmées

[MAIR-453](https://mairie-360.atlassian.net/browse/MAIR-453): a refused users read retains the last received rows and offers a dedicated GET-only retry using the current search/page. A confirmed create closes its form without inventing a user row; a confirmed delete removes only that user's row and closes its editor. Until server readback succeeds, totals and pagination are explicitly stale. Refused writes retain the draft/confirmation; older reads cannot resurrect a confirmed deletion. No API/BFF, generated client, contract, authentication or demonstration data changes.

Une lecture refusée conserve les dernières lignes reçues et propose une reprise GET seule avec les critères actuels. Une création confirmée ferme son formulaire sans fabriquer de compte ; une suppression confirmée retire seulement sa ligne et ferme sa fiche. Totaux et pagination attendent la relecture serveur. Une écriture refusée conserve le brouillon/la confirmation ; une ancienne lecture ne rétablit pas le compte supprimé. Régressions : `node --test tests/administration-page-html.bff-mock.test.cjs`.

## Partial user edits / Modifications utilisateur partielles

[MAIR-454](https://mairie-360.atlassian.net/browse/MAIR-454) / [issue #130](https://github.com/mairie360/Administrator_Web_Service/issues/130): profile and role writes are independent, not an atomic transaction. The editor and table retain each confirmed change and explain unconfirmed role writes without reporting full success. All started writes finish before controls unlock. Explicit retry submits only remaining differences; confirmed profiles, additions and removals are not replayed, and older list reads cannot undo them. Profile-only edits preserve unchanged roles.

Les confirmations indépendantes restent visibles dans la fiche et le tableau ; les changements de rôle non confirmés sont distingués et leur sélection conservée. Une reprise explicite ne renvoie que les changements restants, après la fin de tous les appels engagés. Aucun API/BFF, contrat, client/proxy, authentification, dépendance, droit ou déploiement modifié. Les fixtures restent réservées aux tests ; elles ne certifient ni transaction atomique ni droits réels déployés. Vérification : `node --test tests/administration-page-html.bff-mock.test.cjs`.

## Shared UI alignment / Alignement UI partagé — MAIR-180

This consumer pins the published `@mairie360/lib-components@0.6.10`, including
its exact download URL and SHA512 integrity. Only the shared UI entry changes
in the lockfile; all other dependencies and security policies are preserved.
Tracking: [MAIR-180](https://mairie-360.atlassian.net/browse/MAIR-180) and
[cross-frontend issue](https://github.com/mairie360/Login_Web_Service/issues/142).
Login stays standalone without header/sidebar/footer; authenticated module
shells and the existing Elearning confirmation/rating features are preserved.
No API/BFF, contract, runtime configuration, demo data or deployment approval change.

Le pin exact et l'intégrité du package publié sont alignés sur Elearning sans
le rétrograder. Les tests de release vérifient le manifeste, le lockfile et le
vrai package installé. Une validation isolée ne remplace pas la CI verte,
l'intégration des sept consommateurs et la recette de la copie locale livrée.

## Full consumer composition / Composition complète du consommateur — 4 October 2026

The current PR #140 candidate also composes user reload recovery (#129,
MAIR-453), independent profile/role confirmations (#131, MAIR-454), pending
session protection (#133, MAIR-460), and the published shared UI pin (#134,
MAIR-180), alongside the earlier membership/role/group corrections. Only
README merge conflicts needed manual resolution; both behaviours were retained.
One additional real-component HTTP regression follows a partial profile/role
confirmation with a confirmed user deletion and refused list readback. GET-only
recovery preserves another user's draft without leaking the deleted account's
remaining role request. All 80 targeted tests and 217 Node tests / 15 suites
pass; sequential coverage is 96.39% lines, 92.93% branches and 91.15% functions,
with the unchanged 60% gates. TypeScript, published User 0.5.0 contract and a
one-worker production webpack build pass; lint has two existing effect warnings.

Native browser QA exercised the composed build at actual 1280×720 and 390×844:
partial profile confirmation, confirmed user deletion followed by GET503,
member addition/group deletion/role deletion with failed readback and GET-only
recovery, independent drafts, and mobile pending/refused/confirmed session
refresh and group deletion. The mobile dialog fits the viewport; focus starts
on Cancel and moves between its actions. No outer overflow, framework overlay
or relevant console warning/error was observed. The disposable ledger records
28 GET and 11 write attempts, including explicitly refused writes, with no
validator violations within the declared error-response exceptions. The two
session submissions retained the same synthetic value, checked in the local
ledger because browser DOM observations redact password inputs. Confirmed
refresh clears the field; retry only reads. No real account, password reset,
permission grant, deployed transaction or persistence was tested. The prior
20-case/desktop recipe above remains historical, not retroactively mobile proof.

Cette recette du candidat composé complète les preuves isolées sans modifier
les API/BFF, clients, contrats, authentification ou politique de sécurité. Le
tarball UI 0.6.10 est vérifié contre le SHA512 du lock puis installé uniquement
dans la copie QA autonome ; les dépendances utilisateur 0.6.8 sont conservées.
La référence ancienne est relue mais aucune nouvelle comparaison visuelle
appariée exhaustive n'est revendiquée. Les mocks, données jetables, captures et
logs restent hors Git. Tous les serveurs sont arrêtés après la recette. Les
tickets restent ouverts tant que CI, intégration dans main et actualisation de
la copie livrée ne sont pas réellement validées. Aucun bypass d'audit rouge,
déploiement, pin de cluster, donnée de démonstration produit ni changement de
Login sans AppShell.

### Unread user totals — MAIR-470 follow-up

Before the first successful users response, the footer now distinguishes a
loading or unavailable total and pagination from confirmed empty results.
An empty successful response still shows zero users; a refused later read
keeps the last confirmed rows and counts. The existing layout, query, request
guards and mutation-confirmation behavior are preserved.

Two behavioral regressions fail on the previous source and pass after the
change. The composed candidate passes 252 Node tests with the unchanged 60%
coverage gates, TypeScript, published User 0.5.0 contracts, lint and a production
webpack build limited to one worker. Browser revalidation on integrated main
and actual dev delivery remain separate requirements. No API/BFF, contract,
dependency, authentication, workflow or accessibility configuration is changed.


## Read-only session management / Gestion des sessions en lecture — MAIR-406

The token form and unused frontend token-command helpers are retired following the explicit decision of 10 October 2026. Active/history lists, status labels and GET refresh remain available. The former MAIR-460 token-draft verification above is historical. User0.5.0 has no typed session-ID revocation operation; no substitute payload or write is added. API/BFF, published contracts, cookie transport and all delivery/security/RGAA settings remain unchanged.

Le formulaire à jeton et ses helpers frontend inutilisés sont retirés selon la décision explicite du 10 octobre 2026. Listes actives/historique, états et actualisation GET restent disponibles. La vérification MAIR-460 ci-dessus est historique ; aucune commande de révocation par identifiant n’est inventée sans contrat publié.
