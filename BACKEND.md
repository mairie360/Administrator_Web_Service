# Administration — tables et routes backend

## Tables

| Table | Données utilisées par le front | État |
|---|---|---|
| `users` | Identité, contact, service, statut et dernière connexion | Existante, à étendre pour `service` |
| `roles` | Rôle administrateur, manager ou utilisateur | Existante |
| `user_roles` | Rôles affectés aux utilisateurs | Existante |
| `sessions` | Sessions actives, dernière connexion et révocation | Existante |
| `application_logs` | Niveau, source, titre, description, date et adresse IP | À créer |
| `audit_logs` | Action, acteur, cible, résultat et date | À créer |
| `system_settings` | Sécurité, maintenance, inscription, e-mails et sauvegardes | À créer |
| `backup_runs` | Date, statut et emplacement des sauvegardes | À créer |

## Routes backend

| Méthode | Route backend | Tables ou source | État |
|---|---|---|---|
| `GET` | `/api/v1/admin/users/` | `users`, `user_roles`, `roles`, `sessions` | À créer |
| `POST` | `/api/v1/admin/users/` | `users` | Existante |
| `GET` | `/api/v1/admin/users/{userId}/` | `users`, `user_roles`, `roles` | Existante |
| `PATCH` | `/api/v1/admin/users/{userId}/` | `users` | Existante |
| `DELETE` | `/api/v1/admin/users/{userId}/` | `users` | Existante |
| `GET` | `/api/v1/admin/roles/` | `roles` | Existante |
| `POST` | `/api/v1/admin/users/{userId}/roles/` | `user_roles` | Existante |
| `DELETE` | `/api/v1/admin/users/{userId}/roles/{roleId}` | `user_roles` | Existante |
| `GET` | `/api/v1/admin/logs` | `application_logs` | À créer |
| `DELETE` | `/api/v1/admin/logs` | `application_logs` | À créer |
| `GET` | `/api/v1/admin/system/metrics` | Télémétrie et base de données | À créer |
| `GET` | `/api/v1/admin/system/services` | Santé des services | À créer |
| `POST` | `/api/v1/admin/backups` | `backup_runs` | À créer |
| `GET` | `/api/v1/admin/audit` | `audit_logs` | À créer |
| `GET` | `/api/v1/admin/settings` | `system_settings` | À créer |
| `PATCH` | `/api/v1/admin/settings` | `system_settings` | À créer |
| `POST` | `/api/v1/admin/users/reset-passwords` | `users`, `sessions`, `audit_logs` | À créer |
