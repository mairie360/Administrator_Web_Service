# BFF — Administration

Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

AdministrationModule n'est pas encore raccordé aux données métier. L'ancien administration-console.tsx et BFF User exposent déjà utilisateurs/rôles/groupes/sessions ; logs, audit, supervision et réglages globaux restent proposés. L'accès est réservé aux administrateurs.

Tables et routes propriétaires : [BACKEND.md](BACKEND.md).

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

## Routes communes

Les identifiants renvoyés par un domaine restent ceux de son backend, même lorsqu'un BFF les sérialise en chaîne. `phone` côté Core/DTO correspond à `users.phone_number` en SQL ; `name`/`fullName` est composé à partir du prénom et du nom, sans découpage automatique inverse. Les rôles d'affichage sont adaptés par chaque front à partir de `roles`, sans nouvelle table de rôles par module. Le profil s'édite dans **Paramètres > Profil** ; les anciennes pages `/profile` ne définissent pas un stockage distinct.

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF User `/me` (alias `/session/me`) | Core `GET /api/v1/user/me/` + `GET /api/v1/groups/` | Identité, rôles et groupes communs ; réponse actuelle `{user, groups, roles}` ; enrichir avec identifiant, avatar, service, poste et dernière connexion | Partiel |
| POST | BFF User `/auth/logout` | Actuel : suppression du cookie ; cible : Core `POST /api/v1/sessions/revoke` avec le refresh token de la session courante | Déconnexion ; révocation serveur à brancher, pas une suppression de toutes les sessions | Partiel |
| GET | BFF User `/notifications` | Core `GET /api/v1/user/me/notifications/` | Notifications du bandeau et compteur non lu ; ne pas utiliser la constante de démonstration 3 | Proposé |
| PATCH | BFF User `/notifications/{notificationId}/read` | Core `PATCH /api/v1/user/me/notifications/{notificationId}/read` | Marquage lu et compteur actualisé pour l'utilisateur connecté | Proposé |

## Routes du module

| Méthode | Service et route BFF | Route backend / source | Données nécessaires au front | État |
| --- | --- | --- | --- | --- |
| GET | BFF User `/bff/admin/bootstrap` | Core utilisateurs/rôles/services + logs/audit/supervision/réglages ci-dessous | stats (utilisateurs/actifs/avertissements/erreurs), users, logs, resources, databaseMetrics, serverStatuses, auditEntries, settings, référentiels et permissions | Proposé |
| GET | BFF User `/bff/admin/users` | Actuel : SQL users/roles ; cible : Core `GET /api/v1/admin/users/` | Recherche, rôle, statut, pagination ; id, nom, e-mail, téléphone, service, rôles, statut, dernière connexion | Partiel ; service et dernière connexion à enrichir |
| POST | BFF User `/bff/admin/users` | Core `POST /api/v1/admin/users/` | Créer un utilisateur ; serviceId et profil à compléter dans le contrat Core | Partiel |
| PATCH | BFF User `/bff/admin/users/{userId}` | Core `PATCH /api/v1/admin/users/{userId}/` | Prénom/nom, e-mail, téléphone existants ; service, statut et activation à ajouter explicitement | Partiel ; statut non accepté par le PATCH Core actuel |
| PATCH | BFF User `/bff/admin/users/{userId}/password` | Actuel : SQL users/sessions ; cible : Core `PATCH /api/v1/admin/users/{userId}/password` | Modification administrative du mot de passe, sans lecture du secret | Partiel |
| DELETE | BFF User `/bff/admin/users/{userId}` | Core `DELETE /api/v1/admin/users/{userId}/` | Retirer/archiver l'utilisateur selon la politique Core ; ne pas assimiler suppression et suspension | Existant |
| GET, POST | BFF User `/bff/admin/roles` | Core `GET, POST /api/v1/admin/roles/` | Liste et création des rôles | Existant |
| PUT, PATCH, DELETE | BFF User `/bff/admin/roles/{roleId}` | Core `PUT, PATCH, DELETE /api/v1/admin/roles/{roleId}` | Gestion d'un rôle | Existant |
| POST | BFF User `/bff/admin/users/{userId}/roles` | Core `POST /api/v1/admin/users/{userId}/roles/` | Attribuer un rôle ; tables communes users/roles/user_roles | Existant |
| DELETE | BFF User `/bff/admin/users/{userId}/roles/{roleId}` | Core `DELETE /api/v1/admin/users/{userId}/roles/{roleId}` | Retirer un rôle | Existant |
| GET, POST | BFF User `/bff/admin/groups` | Core `GET, POST /api/v1/groups/` | Groupes ; la liste actuelle suit le périmètre de l'appelant | Existant |
| GET, DELETE | BFF User `/bff/admin/groups/{groupId}` | Core `GET, DELETE /api/v1/groups/{groupId}/` | Détail et suppression d'un groupe | Existant |
| PATCH | BFF User `/bff/admin/groups/{groupId}` | Actuel : SQL groups ; cible : Core `PATCH /api/v1/groups/{groupId}/` | Nom et description du groupe | Partiel |
| GET, POST | BFF User `/bff/admin/groups/{groupId}/users` | Actuel : SQL group_members ; cible : Core `GET, POST /api/v1/groups/{groupId}/users/` | Membres d'un groupe ; harmoniser avec group_users de Core | Partiel |
| DELETE | BFF User `/bff/admin/groups/{groupId}/users/{userId}` | Actuel : SQL group_members ; cible : Core `DELETE /api/v1/groups/{groupId}/users/{userId}/` | Retrait d'un membre | Partiel |
| GET | BFF User `/bff/admin/sessions` | Core `GET /api/v1/sessions/` | Sessions de l'appelant, pas toutes les sessions de tous les utilisateurs | Existant ; portée limitée |
| GET | BFF User `/bff/admin/sessions/history` | Core `GET /api/v1/sessions/history` | Historique de l'appelant | Existant ; portée limitée |
| POST | BFF User `/bff/admin/sessions/refresh` | Core `POST /api/v1/sessions/refresh` | Rafraîchir à partir du refresh_token | Existant |
| POST | BFF User `/bff/admin/sessions/revoke` | Core `POST /api/v1/sessions/revoke` | Révoquer à partir du refresh_token, pas d'un sessionId | Existant |
| GET, DELETE | BFF User `/bff/admin/logs` | Core `GET, DELETE /api/v1/admin/logs/` | Liste, filtre par niveau, actualisation, effacement après confirmation ; source, message, date, utilisateur, IP | Proposé |
| GET | BFF User `/bff/admin/logs/export` | Core `GET /api/v1/admin/logs/export` | Export CSV selon les mêmes filtres que la liste | Proposé |
| GET | BFF User `/bff/admin/system` | Core `GET /api/v1/admin/system/metrics` + `GET /api/v1/admin/system/services` | CPU/RAM/disque/réseau, unités/capacités, statistiques BDD et dernière sauvegarde, état API/BDD/storage/e-mail | Proposé |
| POST | BFF User `/bff/admin/backups` | Core `POST /api/v1/admin/backups/` | Lancer une sauvegarde, restituer identifiant et état du traitement | Proposé |
| GET | BFF User `/bff/admin/audit` | Core `GET /api/v1/admin/audit/` | Actions sensibles réussies/refusées : auteur, cible, action, détails, date, résultat | Proposé |
| GET, PATCH | BFF User `/bff/admin/settings` | Core `GET, PATCH /api/v1/admin/settings/` | MFA obligatoire, expiration heures, maximum tentatives, maintenance, inscription publique, e-mails automatiques, fréquence sauvegardes | Proposé |
| POST | BFF User `/bff/admin/actions/reset-passwords` | Core `POST /api/v1/admin/users/reset-passwords` | Imposer le renouvellement à la prochaine connexion ; confirmation et audit | Proposé |

## Points d'alignement

| Sujet | Contrat / écart |
| --- | --- |
| Sessions administrateur | Le module Core `/api/v1/admin/sessions` existe dans des fichiers mais n'est pas monté dans admin::config. Ne pas le déclarer disponible ; les routes BFF actuelles appellent les routes personnelles `/api/v1/sessions/*`. |
| Compteurs | Définir le même périmètre/période pour liste et compteurs. Les valeurs 4 utilisateurs, 3 actifs, 1 avertissement et 2 erreurs des captures sont des exemples, pas des valeurs contractuelles. |

## Sources

| Périmètre | Référence |
| --- | --- |
| Front inspecté | [src/app/page.tsx](src/app/page.tsx) |
| Identité / sessions / groupes | [Core_API 9904624](https://github.com/mairie360/Core_API/tree/99046240dd9742217d2a2c3d282721b785cacca0/src) ; [BFF_user b7c3477](https://github.com/mairie360/BFF_user/tree/b7c3477f858073aa846ba0129cbb29152528e6d2/src) |
| Données des composants partagés | [lib-components 88b339b](https://github.com/mairie360/lib-components/tree/88b339b77d06670b14b5f2f3d1f3d10ed471bb03/src/components/administration) |
