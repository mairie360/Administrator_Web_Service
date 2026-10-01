# Administrator_Web_Service — Présentation du module

## Navigation des modules actifs

L'`AppShell` partagé gère désormais les menus ordinateur et mobile. Il affiche
les destinations actives configurées, sans les modules archivés E-mails et
Fichiers, tout en conservant la visibilité administrateur et Paramètres. Les
pièces jointes et documents métier des modules actifs ne sont pas supprimés.

## Un seul espace compte

Le profil s'ouvre dans **Paramètres (Settings)**. Il n'existe plus de page profil
locale ; le middleware du front redirige les anciens liens `/profile` et leurs
sous-chemins authentifiés vers Settings. Sans configuration valide, il répond
avec une indisponibilité sans cache. Aucune identité de démonstration ni fausse
sauvegarde n'est affichée.

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Héberger l’interface d’administration de Mairie360: navigation, contexte de session et composant d’administration partagé. Le service expose les routes de BFF User à la même origine que l’interface.

## Public et utilité

Les administrateurs des comptes et des habilitations.

Domaine fonctionnel: Identité et administration.

## Fonctions disponibles

- Console d'administration alimentée par le BFF dans l'`AppShell` partagé.
- Client typé pour utilisateurs, rôles, groupes, membres et sessions.
- Navigation entre modules, profil et déconnexion basés sur la session.

### Panneaux adaptatifs de la console (MAIR-372)

Les cartes conservent l'ombre de la référence locale. Les noms longs passent
à la ligne dans l'espace disponible, y compris le titre du groupe sélectionné,
sans élargir la page. Les actions des panneaux et identifiants de groupe ne
rétrécissent pas et ne se coupent pas au milieu d'un mot. Les tableaux larges gardent leur propre défilement
horizontal. Seule la présentation du front change : les données, permissions
et opérations du contrat restent inchangées. La recette adaptative se fait
dans le navigateur à 390px, 768px et 1280px ; les tests HTML seuls ne prouvent
pas la fidélité du rendu.

## Parcours type

1. Ouvrir l’interface avec une session disposant des habilitations nécessaires.
2. Consulter les fonctions d’administration disponibles dans le composant partagé.
3. Effectuer les opérations prises en charge par le contrat et consulter les réponses serveur.

## Place dans Mairie360

Dépôts associés: [BFF_user](https://github.com/mairie360/BFF_user).

Ce dépôt contient l’interface navigateur et ses adaptateurs Next.js. Le BFF associé fournit les données métier et coordonne leurs sources.

## Données et état actuel

Core fournit les opérations d’identité et de session. Les dépôts SQL du BFF lisent aussi les utilisateurs et rôles, et réalisent certaines mutations de mots de passe et de groupes. Le parcours de première connexion utilise PostgreSQL et Redis. Les données ne sont donc pas toutes accessibles exclusivement par HTTP.

## Périmètre et limites

Les fonctions de supervision, sauvegarde, journaux applicatifs et politique système décrites dans les besoins d’administration ne sont pas garanties par ce contrat. Les accès SQL exigent un schéma compatible, notamment `group_members`; ne pas confondre ce nom avec `group_users` utilisé dans d’autres contrats.

`src/app/page.tsx` monte la console locale `AdministrationConsole`, qui utilise
le client typé `src/lib/administration-api.ts`, dans l'`AppShell` de
`@mairie360/lib-components`. La bibliothèque fournit navigation et mise en page,
pas les données métier.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
