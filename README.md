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
