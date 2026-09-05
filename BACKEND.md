# Backend — Administration

Correspondance front/BFF : [BFF.md](BFF.md). Référentiel de besoins harmonisé le 5 septembre 2026. Documentation uniquement : aucune route ni migration n'est créée par ces fichiers. Les chemins BFF sont relatifs au service indiqué, pas au préfixe des proxies Next.js ; les chemins backend conservent leurs préfixes réels.

`Existant` : déclaré dans les sources locales ; `Partiel` : route présente mais données manquantes, SQL direct ou mémoire ; `Client généré` : chemin observé dans le client installé, déploiement non vérifié ; `Proposé` : contrat cible à implémenter/valider. Pour les tables, `SQL observé` ne prouve pas qu'une migration est déployée.

Les tables sont des sources ou des besoins cibles, pas un script SQL. Les références interservices (`user_id`, `file_id`, etc.) sont logiques : elles n'imposent pas de clé étrangère entre bases distinctes. Les BFF doivent à terme passer par les API propriétaires ; les accès SQL directs et replis mémoire actuels sont signalés. Les permissions restent contrôlées par le serveur.

## Tables communes

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `users` | `id` ; `first_name`, `last_name`, `email`, `phone_number`, `status`, `is_archived`, `first_connect`. `password` reste exclusivement côté serveur | SQL observé |
| Core `roles`, `user_roles` | `roles.id`, `roles.name` ; association `user_roles(user_id, role_id)` vers `users.id` et `roles.id` | SQL observé |
| Core `groups`, `group_users` | `groups.id`, `owner_id`, `name`, `description` ; association `group_users(group_id, user_id)` ; nomenclature cible commune basée sur Core | SQL observé dans Core ; divergence `group_members` dans les BFF User/Calendar/Project à résoudre, pas une seconde table cible |
| Core `sessions` | `id`, `user_id`, `created_at`, `expires_at`, `device_info`, `ip_address`, `revoked_at` ; `token_hash` interne, jamais exposé. Dernière connexion dérivée des sessions, pas de la date courante | SQL observé ; vue `v_sessions` utilisée par Core |
| Core `user_profiles` | `user_id` unique vers `users.id` ; `avatar_file_id` vers Files `files.id`, `service_id` vers `services.id`, `position`, `biography` ; `address`, `city` seulement pour compatibilité des anciens profils | Proposé ; ne pas dupliquer identité, mot de passe ou rôles |
| Core `services` | `id`, `code` unique, `name`, `active` ; même annuaire pour Paramètres, Administration, Calendrier, contacts et membres de projets | Proposé ; distinct des groupes d'habilitation |
| Core `notifications` | `id`, `user_id`, `type`, `title`, `body`, `resource_type`, `resource_id`, `created_at`, `read_at` ; source du compteur commun | Proposé ; distinct des préférences `user_notification_settings` |

## Tables du module

| Table / source propriétaire | Clés et données nécessaires | État |
| --- | --- | --- |
| Core `application_logs` | `id`, `level`, `source`, `message`, `user_id`, `ip_address`, `created_at` ; export et filtres sur la même source | Proposé ; journal métier de diagnostic ou source de logs équivalente |
| Core `audit_logs` | `id`, `actor_user_id`, `action`, `target_type`, `target_id`, `details`, `result`, `created_at` | Proposé ; distinct de application_logs, non supprimé implicitement par effacement des logs |
| Core `system_settings` | Clé/valeur typée ; `two_factor_required`, `session_expiration_hours`, `max_login_attempts`, `maintenance`, `public_registration`, `email_notifications`, `backup_frequency` | Proposé ; même politique consommée par Connexion et Paramètres |
| Core `backup_runs` | `id`, `requested_by`, `status`, `started_at`, `completed_at`, `size_bytes`, référence de stockage, erreur | Proposé |
| Supervision / catalogue BDD | Mesures CPU, RAM, disque, réseau, santé des services, taille BDD, nombre de tables/enregistrements ; horodatage de mesure | Source opérationnelle, pas une table de métriques fictive dans le front |

## Routes backend communes

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Core `/api/v1/user/me/` | `users`, `roles`, `user_roles` ; cible : `user_profiles`, `services`, `sessions` | Existant ; enrichissement proposé (notamment `id`, absent de GetMeResponseView local) |
| PATCH | Core `/api/v1/user/me/` | `users` ; cible : `user_profiles` | Existant pour prénom, nom, e-mail, téléphone ; extension proposée pour le profil |
| GET | Core `/api/v1/groups/` | `groups`, `group_users` | Existant ; groupes de l'appelant |
| GET | Core `/api/v1/sessions/` | `sessions`, vue `v_sessions` | Existant ; sessions de l'appelant |
| GET | Core `/api/v1/sessions/history` | `sessions`, vue `v_sessions` | Existant ; historique de l'appelant |
| POST | Core `/api/v1/sessions/refresh` | `sessions` ; entrée `refresh_token` | Existant |
| POST | Core `/api/v1/sessions/revoke` | `sessions` ; entrée `refresh_token` | Existant ; ce n'est pas une révocation par `sessionId` |
| DELETE | Core `/api/v1/sessions/{sessionId}` | `sessions` ; session appartenant à l'appelant | Proposé pour la déconnexion d'un autre appareil, sans exposer son refresh token |
| GET | Core `/api/v1/services/` | `services` | Proposé ; annuaire unique |
| GET | Core `/api/v1/users/directory/` | `users`, `user_profiles`, `services`, `roles`, `user_roles`, `groups`, `group_users` | Proposé ; annuaire limité au périmètre autorisé |
| GET | Core `/api/v1/user/me/notifications/` | `notifications` ; filtre utilisateur connecté | Proposé |
| PATCH | Core `/api/v1/user/me/notifications/{notificationId}/read` | `notifications.read_at` ; filtre utilisateur connecté | Proposé |

## Routes backend du module

| Méthode | Service et route backend | Tables / source | État |
| --- | --- | --- | --- |
| GET | Core `/api/v1/admin/users/` | `users`, `roles`, `user_roles`, `user_profiles`, `services`, `sessions` | Proposé : aucun GET collection monté dans Core local |
| POST | Core `/api/v1/admin/users/` | `users` ; extension `user_profiles`/service | Existant ; extension proposée |
| GET, PATCH, DELETE | Core `/api/v1/admin/users/{userId}/` | `users` ; extension `user_profiles`, statut et service | Existant ; PATCH actuel limité à identité/contact |
| PATCH | Core `/api/v1/admin/users/{userId}/password` | `users`, `sessions` | Proposé ; remplace SQL direct BFF |
| GET, POST | Core `/api/v1/admin/roles/` | `roles` | Existant |
| PUT, PATCH, DELETE | Core `/api/v1/admin/roles/{roleId}` | `roles`, `user_roles` selon action | Existant |
| POST | Core `/api/v1/admin/users/{userId}/roles/` | `user_roles` | Existant |
| DELETE | Core `/api/v1/admin/users/{userId}/roles/{roleId}` | `user_roles` | Existant |
| POST | Core `/api/v1/groups/` | `groups` | Existant |
| GET, DELETE | Core `/api/v1/groups/{groupId}/` | `groups`, `group_users` | Existant |
| PATCH | Core `/api/v1/groups/{groupId}/` | `groups` | Proposé |
| GET, POST | Core `/api/v1/groups/{groupId}/users/` | `group_users`, `users` | Existant ; à réutiliser au lieu du SQL group_members |
| DELETE | Core `/api/v1/groups/{groupId}/users/{userId}/` | `group_users` | Existant |
| GET, DELETE | Core `/api/v1/admin/logs/` | `application_logs` | Proposé ; suppression administrative confirmée |
| GET | Core `/api/v1/admin/logs/export` | `application_logs` | Proposé |
| GET | Core `/api/v1/admin/system/metrics` | Supervision, catalogue BDD, `backup_runs` | Proposé ; mesures réelles datées |
| GET | Core `/api/v1/admin/system/services` | État API, base, stockage et transport e-mail | Proposé |
| POST | Core `/api/v1/admin/backups/` | `backup_runs`, sauvegarde réelle de la base | Proposé |
| GET | Core `/api/v1/admin/audit/` | `audit_logs`, identité auteur via `users` | Proposé |
| GET, PATCH | Core `/api/v1/admin/settings/` | `system_settings`, `audit_logs` | Proposé |
| POST | Core `/api/v1/admin/users/reset-passwords` | `users.first_connect`, `sessions` selon politique, `audit_logs` | Proposé ; ne jamais retourner les mots de passe |

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
