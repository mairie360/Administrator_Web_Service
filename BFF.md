# Administration — routes BFF

| Méthode | Route BFF | Besoin du front | État |
|---|---|---|---|
| `GET` | `/bff/admin/bootstrap` | Compteurs, utilisateurs, journaux, ressources, audit et paramètres | À créer |
| `GET` | `/bff/admin/users` | Liste, recherche et filtres des utilisateurs | Existant |
| `POST` | `/bff/admin/users` | Création d’un utilisateur | Existant |
| `PATCH` | `/bff/admin/users/{userId}` | Modification, activation ou suspension d’un utilisateur | Existant |
| `DELETE` | `/bff/admin/users/{userId}` | Suppression d’un utilisateur | Existant |
| `GET` | `/bff/admin/roles` | Rôles proposés lors de la création et de l’édition | Existant |
| `POST` | `/bff/admin/users/{userId}/roles` | Attribution d’un rôle | Existant |
| `DELETE` | `/bff/admin/users/{userId}/roles/{roleId}` | Retrait d’un rôle | Existant |
| `GET` | `/bff/admin/logs` | Journaux filtrés par niveau | À créer |
| `GET` | `/bff/admin/logs/export` | Export CSV des journaux | À créer |
| `DELETE` | `/bff/admin/logs` | Effacement de tous les journaux | À créer |
| `GET` | `/bff/admin/system` | CPU, RAM, disque, réseau, base et état des services | À créer |
| `POST` | `/bff/admin/backups` | Création d’une sauvegarde | À créer |
| `GET` | `/bff/admin/audit` | Historique des actions sensibles | À créer |
| `GET` | `/bff/admin/settings` | Paramètres de sécurité et système | À créer |
| `PATCH` | `/bff/admin/settings` | Modification des paramètres de sécurité et système | À créer |
| `POST` | `/bff/admin/actions/reset-passwords` | Réinitialisation globale des mots de passe | À créer |
