| Route actuelle | Donnée | JSON réellement disponible | JSON absent, remplacé ou non persistant | Origine actuelle | État |
|---|---|---|---|---|---|
| `GET /me` | Compte connecté | `{"user":{"first_name":"string","last_name":"string","email":"string","phone":"string/null","role":"string","status":"string","groups":[{"id":"number","name":"string"}]},"groups":[{"id":"number","name":"string"}],"roles":["string"]}` | `{"avatar":"string","avatarUrl":"string","position":"string","address":"string","city":"string","lastConnection":"string"}` | `Core API` | `incomplet` |
| `GET /me` | Rôle absent ou inconnu | `{"role":"string/null","roles":["string"]}` | `{"role_affiche":"Guest"}` | `fallback Web Service` | `remplacé` |
| `GET /bff/admin/users` | Utilisateurs administrables | `{"users":[{"id":"number","first_name":"string","last_name":"string","email":"string","phone_number":"string/null","status":"string","is_archived":"boolean","roles":[{"id":"number","name":"string"}]}],"page":"number","page_size":"number","total":"number","total_pages":"number"}` | `{"route_core":"GET /api/v1/admin/users"}` | `SQL BFF` | `route BFF présente, route Core absente` |
| `contrôle requireAdmin` | Autorisation administrateur | `{"userId":"number","is_admin":"boolean"}` | `{"route_core":"GET /api/v1/admin/users/{userId}/roles"}` | `SQL BFF` | `route Core absente` |
| `PATCH /bff/admin/users/{userId}/password` | Mot de passe et révocation des sessions | `{"new_password":"string"}` | `{"route_core":"PATCH /api/v1/admin/users/{userId}/password","response":"HTTP 204"}` | `SQL BFF` | `route Core absente` |
| `PATCH /bff/admin/groups/{groupId}` | Nom et description du groupe | `{"name":"string?","description":"string?"}` | `{"route_core":"PATCH /api/v1/groups/{groupId}"}` | `SQL BFF` | `route Core absente` |
| `GET /bff/admin/groups/{groupId}/users` | Membres du groupe | `{"users":[{"id":"number","first_name":"string","last_name":"string","email":"string","phone_number":"string/null","status":"string","is_archived":"boolean"}]}` | `{}` | `SQL BFF` | `route Core disponible non utilisée` |
| `POST /bff/admin/groups/{groupId}/users` | Ajout d’un membre | `{"user_id":"number"}` | `{}` | `SQL BFF` | `route Core disponible non utilisée` |
| `DELETE /bff/admin/groups/{groupId}/users/{userId}` | Retrait d’un membre | `{}` | `{}` | `SQL BFF` | `route Core disponible non utilisée` |

| Type | Route manquante ou branchement manquant | Route disponible | JSON entrée | JSON sortie attendue | Données couvertes |
|---|---|---|---|---|---|
| `BFF` | `PATCH /me` | `PATCH /api/v1/user/me/` | `{"email":"string?","first_name":"string?","last_name":"string?","phone":"string/null?"}` | `{}` | `email`, `first_name`, `last_name`, `phone` |
| `Core API` | `GET /api/v1/admin/users` | `null` | `{"page":"number","page_size":"number","search":"string?"}` | `{"users":[{"id":"number","first_name":"string","last_name":"string","email":"string","phone_number":"string/null","status":"string","is_archived":"boolean","roles":[{"id":"number","name":"string"}]}],"page":"number","page_size":"number","total":"number","total_pages":"number"}` | `users`, `roles`, `pagination` |
| `Core API` | `GET /api/v1/admin/users/{userId}/roles` | `null` | `{}` | `{"roles":[{"id":"number","name":"string"}],"is_admin":"boolean"}` | `autorisation administrateur` |
| `Core API` | `PATCH /api/v1/admin/users/{userId}/password` | `null` | `{"new_password":"string"}` | `{}` | `password`, `sessions.revoked_at` |
| `Core API` | `PATCH /api/v1/groups/{groupId}` | `null` | `{"name":"string?","description":"string?"}` | `{"id":"number","owner_id":"number","name":"string","description":"string/null"}` | `group.name`, `group.description` |
| `Branchement BFF` | `GET /bff/admin/groups/{groupId}/users -> Core API` | `GET /api/v1/groups/{groupId}/users/` | `{}` | `{"users":["user"]}` | `group.members` |
| `Branchement BFF` | `POST /bff/admin/groups/{groupId}/users -> Core API` | `POST /api/v1/groups/{groupId}/users/` | `{"user_id":"number"}` | `{}` | `group.members` |
| `Branchement BFF` | `DELETE /bff/admin/groups/{groupId}/users/{userId} -> Core API` | `DELETE /api/v1/groups/{groupId}/users/{userId}/` | `{}` | `{}` | `group.members` |
| `Contrat Core` | `extension GET /api/v1/user/me/` | `GET /api/v1/user/me/` | `{}` | `{"avatar":"string","avatarUrl":"string","position":"string","address":"string","city":"string","lastConnection":"string"}` | `avatar`, `avatarUrl`, `position`, `address`, `city`, `lastConnection` |
| `Contrat Core` | `extension PATCH /api/v1/user/me/` | `PATCH /api/v1/user/me/` | `{"avatar":"string?","avatarUrl":"string?","position":"string?","address":"string?","city":"string?"}` | `{}` | `avatar`, `avatarUrl`, `position`, `address`, `city` |
