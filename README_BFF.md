# README BFF - Contrat de donnees Front-end

Ce document decrit les donnees que le front-end Mairie360 doit recevoir et envoyer a un BFF (Backend For Frontend).

Le front utilise actuellement Next.js et `@mairie360/lib-components`. Les champs ci-dessous reprennent les props attendues par les composants `Header`, `Sidebar`, `AdministrationModule` et `UserProfilePage`.

## Conventions

- Format: JSON.
- Dates: ISO 8601 UTC cote BFF, ex. `2026-06-28T08:30:00Z`. Le front peut formater en `28/06/2026` ou `Aujourd'hui`.
- Authentification: cookie de session HTTP-only recommande. Si token, envoyer `Authorization: Bearer <token>`.
- Les icones ne doivent pas etre envoyees comme composants React. Le BFF envoie un `iconId`, puis le front mappe cet id vers une icone locale.
- Les erreurs doivent garder une forme stable:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Adresse e-mail invalide",
    "details": {
      "field": "email"
    }
  }
}
```

## Pages couvertes

- `/`: page Administration.
- `/profile`: page Profil utilisateur.

## Session et utilisateur courant

### `GET /bff/session`

Donnees recues par le front pour alimenter le `Header`, le profil et les droits de navigation.

```json
{
  "user": {
    "id": "usr_admin",
    "name": "Admin Systeme",
    "email": "admin@mairie360.fr",
    "role": "admin",
    "service": "Administration",
    "position": "Administrateur systeme",
    "phone": "+262 000 000 000",
    "avatarUrl": null,
    "address": null,
    "city": null,
    "lastConnection": "2026-07-03T09:10:00Z"
  },
  "permissions": {
    "isAdmin": true,
    "allowedPages": [
      "dashboard",
      "projects",
      "messages",
      "emails",
      "files",
      "training",
      "calendar",
      "admin",
      "profile",
      "settings"
    ]
  }
}
```

Champs utilisateur attendus par le front:

```ts
type CurrentUser = {
  id: string;
  name: string;
  email?: string;
  role?: "admin" | "manager" | "user" | string;
  avatarUrl?: string | null;
  phone?: string | null;
  service?: string | null;
  position?: string | null;
  address?: string | null;
  city?: string | null;
  lastConnection?: string | null;
};
```

## Navigation

La sidebar peut rester definie cote front, car elle depend d'icones React locales. Si le BFF pilote les droits, il doit envoyer uniquement les pages autorisees et les badges eventuels.

Ids de pages utilises par le front:

```ts
type PageId =
  | "dashboard"
  | "projects"
  | "messages"
  | "emails"
  | "files"
  | "training"
  | "calendar"
  | "admin"
  | "profile"
  | "settings";
```

Mapping actuel:

```json
{
  "admin": "/",
  "dashboard": "/",
  "profile": "/profile"
}
```

Option BFF si navigation distante:

```json
{
  "items": [
    {
      "id": "admin",
      "label": "Administration",
      "iconId": "shield",
      "adminOnly": true,
      "badge": "Admin",
      "href": "/"
    },
    {
      "id": "profile",
      "label": "Profil",
      "iconId": "user-round",
      "href": "/profile"
    }
  ]
}
```

## Administration

### `GET /bff/admin`

Endpoint agregateur pour charger la page Administration en une seule requete.

```json
{
  "stats": [
    {
      "id": "total-users",
      "label": "Utilisateurs total",
      "value": 4,
      "tone": "blue",
      "iconId": "users",
      "indicator": "+2 ce mois"
    }
  ],
  "users": [
    {
      "id": "usr_admin",
      "name": "Admin Systeme",
      "email": "admin@mairie360.fr",
      "service": "Direction",
      "phone": "+33 1 23 45 67 89",
      "role": "admin",
      "status": "active",
      "lastConnection": "2026-06-28T08:30:00Z"
    }
  ],
  "logs": [
    {
      "id": "log_001",
      "level": "info",
      "source": "auth",
      "title": "Connexion utilisateur",
      "description": "Connexion reussie depuis le portail admin",
      "actor": "Admin Systeme",
      "timestamp": "2026-07-03T09:10:00Z",
      "ipAddress": "192.168.1.20"
    }
  ],
  "resources": [
    {
      "id": "cpu",
      "label": "CPU",
      "valueLabel": "42%",
      "percentage": 42,
      "tone": "green",
      "iconId": "cpu"
    }
  ],
  "databaseMetrics": [
    {
      "id": "db-size",
      "label": "Taille base de donnees",
      "value": "1.2 Go"
    }
  ],
  "serverStatuses": [
    {
      "id": "api",
      "label": "API principale",
      "description": "Operationnelle",
      "status": "online"
    }
  ],
  "auditEntries": [
    {
      "id": "audit_001",
      "action": "UPDATE_USER",
      "actor": "Admin Systeme",
      "subject": "Marie Martin",
      "description": "Modification du role utilisateur",
      "timestamp": "2026-07-03T09:20:00Z",
      "outcome": "success"
    }
  ],
  "settings": {
    "twoFactorEnabled": true,
    "sessionExpirationHours": 8,
    "maxLoginAttempts": 5,
    "maintenanceMode": false,
    "publicRegistration": false,
    "emailNotifications": true,
    "backupFrequency": "daily"
  },
  "dangerActions": [
    {
      "id": "clear-cache",
      "title": "Vider le cache",
      "description": "Supprime le cache applicatif temporaire",
      "buttonLabel": "Vider",
      "iconId": "trash"
    }
  ]
}
```

Types principaux attendus:

```ts
type AdministrationRole = "admin" | "manager" | "user";
type AdministrationStatus = "active" | "inactive" | "suspended";
type AdministrationLogLevel = "info" | "warning" | "error";
type AdministrationTone = "blue" | "green" | "yellow" | "red" | "gray";
type ServerStatus = "online" | "connected" | "available" | "warning" | "offline";

type AdministrationUser = {
  id: string;
  name: string;
  email: string;
  service: string;
  phone: string;
  role: AdministrationRole;
  status: AdministrationStatus;
  lastConnection: string;
};
```

## Utilisateurs admin

Endpoints recommandes si le front charge ou modifie les utilisateurs separement.

### `GET /bff/admin/users`

Query params envoyes par le front:

```text
search?: string
role?: "admin" | "manager" | "user" | "all"
status?: "active" | "inactive" | "suspended" | "all"
page?: number
pageSize?: number
```

Reponse:

```json
{
  "items": [
    {
      "id": "usr_admin",
      "name": "Admin Systeme",
      "email": "admin@mairie360.fr",
      "service": "Direction",
      "phone": "+33 1 23 45 67 89",
      "role": "admin",
      "status": "active",
      "lastConnection": "2026-06-28T08:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "total": 1
}
```

### `POST /bff/admin/users`

Payload envoye par le front:

```json
{
  "name": "Marie Martin",
  "email": "marie.martin@mairie360.fr",
  "service": "Ressources Humaines",
  "phone": "+33 1 23 45 67 90",
  "role": "manager"
}
```

Reponse: l'utilisateur cree avec `id`, `status` et `lastConnection`.

### `PATCH /bff/admin/users/:id`

Payload envoye par le front:

```json
{
  "name": "Marie Martin",
  "email": "marie.martin@mairie360.fr",
  "service": "Ressources Humaines",
  "phone": "+33 1 23 45 67 90",
  "role": "manager",
  "status": "active"
}
```

### `POST /bff/admin/users/:id/action`

Payload envoye par le front:

```json
{
  "action": "toggle-status"
}
```

Actions possibles:

```ts
type AdministrationUserAction = "open" | "edit" | "toggle-status" | "delete";
```

## Logs, systeme et audit

### `GET /bff/admin/logs`

Query params:

```text
level?: "info" | "warning" | "error" | "all"
cursor?: string
limit?: number
```

Reponse:

```json
{
  "items": [
    {
      "id": "log_001",
      "level": "warning",
      "source": "system",
      "title": "Utilisation CPU elevee",
      "description": "Le serveur a depasse 80% pendant 5 minutes",
      "actor": "system",
      "timestamp": "2026-07-03T09:10:00Z",
      "ipAddress": null
    }
  ],
  "nextCursor": null
}
```

### `POST /bff/admin/logs/export`

Payload:

```json
{
  "level": "all",
  "from": "2026-07-01T00:00:00Z",
  "to": "2026-07-03T23:59:59Z"
}
```

Reponse:

```json
{
  "downloadUrl": "https://bff.example.com/downloads/logs-2026-07-03.csv"
}
```

### `DELETE /bff/admin/logs`

Vide les logs selon les droits utilisateur.

### `GET /bff/admin/system`

Retourne:

```json
{
  "resources": [],
  "databaseMetrics": [],
  "serverStatuses": []
}
```

### `POST /bff/admin/system/backup`

Demande la creation d'une sauvegarde.

Reponse:

```json
{
  "backupId": "backup_20260703_0910",
  "status": "queued"
}
```

### `GET /bff/admin/audit`

Query params:

```text
cursor?: string
limit?: number
actor?: string
outcome?: "success" | "danger"
```

Reponse:

```json
{
  "items": [
    {
      "id": "audit_001",
      "action": "UPDATE_SETTINGS",
      "actor": "Admin Systeme",
      "subject": "Parametres de securite",
      "description": "Activation de la double authentification",
      "timestamp": "2026-07-03T09:20:00Z",
      "outcome": "success"
    }
  ],
  "nextCursor": null
}
```

## Parametres admin

### `PATCH /bff/admin/settings`

Payload envoye par le front:

```json
{
  "twoFactorEnabled": true,
  "sessionExpirationHours": 8,
  "maxLoginAttempts": 5,
  "maintenanceMode": false,
  "publicRegistration": false,
  "emailNotifications": true,
  "backupFrequency": "daily"
}
```

Reponse: le meme objet `settings` persiste.

### `POST /bff/admin/danger-actions/:id`

Payload optionnel:

```json
{
  "confirm": true
}
```

Reponse:

```json
{
  "id": "clear-cache",
  "status": "completed",
  "message": "Cache vide avec succes"
}
```

## Profil utilisateur

### `GET /bff/profile`

Retourne le profil complet de l'utilisateur courant. Peut etre identique a `session.user` si toutes les donnees sont deja disponibles.

```json
{
  "user": {
    "id": "usr_admin",
    "name": "Admin Systeme",
    "email": "admin@mairie360.fr",
    "phone": "+262 000 000 000",
    "service": "Administration",
    "position": "Administrateur systeme",
    "role": "admin",
    "avatarUrl": null,
    "address": null,
    "city": null,
    "lastConnection": "2026-07-03T09:10:00Z"
  }
}
```

### `PATCH /bff/profile`

Champs envoyes par le front lors de l'edition du profil:

```json
{
  "email": "admin@mairie360.fr",
  "phone": "+262 000 000 000",
  "address": "1 rue de la Mairie",
  "city": "Saint-Denis"
}
```

Reponse:

```json
{
  "user": {
    "id": "usr_admin",
    "name": "Admin Systeme",
    "email": "admin@mairie360.fr",
    "phone": "+262 000 000 000",
    "service": "Administration",
    "position": "Administrateur systeme",
    "role": "admin",
    "avatarUrl": null,
    "address": "1 rue de la Mairie",
    "city": "Saint-Denis",
    "lastConnection": "2026-07-03T09:10:00Z"
  }
}
```

## Logout

### `POST /bff/logout`

Le front n'a pas besoin d'envoyer de body si l'authentification repose sur un cookie.

Reponse:

```json
{
  "success": true,
  "redirectTo": "/login"
}
```

## Validations attendues cote BFF

- `email`: format email valide, unicite pour les utilisateurs admin.
- `phone`: chaine non vide si obligatoire metier, format international recommande.
- `role`: uniquement `admin`, `manager`, `user` sauf extension explicite.
- `status`: uniquement `active`, `inactive`, `suspended`.
- `percentage`: nombre entre `0` et `100`.
- `sessionExpirationHours`: entier positif.
- `maxLoginAttempts`: entier positif.
- Actions dangereuses: verification des permissions admin et confirmation explicite.

## Notes d'integration front

- Les donnees BFF doivent etre transformees avant d'etre passees aux composants lorsque le composant attend une icone React:
  - BFF: `{ "iconId": "users" }`
  - Front: `{ icon: Users }`
- Les dates ISO doivent etre formatees cote front avant affichage si le composant attend une chaine lisible.
- `AdministrationModule` accepte un chargement complet via `GET /bff/admin`, mais les endpoints granulaires sont preferables pour rafraichir uniquement les utilisateurs, les logs ou les parametres apres une action.
- Le front doit garder un fallback local pour la navigation afin que l'app reste utilisable si le BFF ne renvoie que les permissions.
