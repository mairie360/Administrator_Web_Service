# Administrator_Web_Service — Présentation du module

[Documentation technique](technical.md) · [English](../en/module.md) · [README](../../README.md)

Héberger l’interface d’administration de Mairie360: navigation, contexte de session et composant d’administration partagé. Le service expose les routes de BFF User à la même origine que l’interface.

## Public et utilité

Les administrateurs des comptes et des habilitations.

Domaine fonctionnel: Identité et administration.

## Fonctions disponibles

- Interface d’administration fournie par `AdministrationModule` de la bibliothèque partagée.
- Client typé pour utilisateurs, rôles, groupes, membres et sessions.
- Navigation entre modules, profil et déconnexion basés sur la session.

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

`src/app/page.tsx` monte `AdministrationModule` sans lui passer de callbacks de données spécifiques. Le comportement détaillé du composant dépend donc de la version de `@mairie360/lib-components`. `src/lib/administration-api.ts` fournit un client local typé, mais sa présence ne prouve pas que chaque écran du composant partagé l’utilise.

## Pour développer ou exploiter ce module

Le [guide technique](technical.md) détaille architecture, configuration, routes, session, persistance, tests et CI/CD. Il décrit les sources de vérité et les étapes de synchronisation des contrats avec les dépôts associés.
