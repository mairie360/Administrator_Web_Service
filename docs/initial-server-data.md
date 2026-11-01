# Première lecture Administration

La page serveur lit le profil par `getMe` du SDK publié. Seul le profil réel du BFF autorise ensuite les cinq lectures de la console : utilisateurs, rôles, groupes, sessions actives et historique. Les appels passent par l’adaptateur Axios et le proxy contractuel existants, avec `no-store` et l’origine `ADMINISTRATION_FRONT_URL` validée. Le rendu lit uniquement le cookie d’accès ; il n’écrit aucun cookie.

Les parseurs partagés du profil et des collections vérifient les valeurs attendues et projettent les champs connus, y compris les rôles imbriqués des utilisateurs. Une collection incohérente reste indisponible ; les autres ressources confirmées sont conservées. Les props transportent les données d’affichage et des messages locaux, sans informations de transport.

Une clé opaque différente à chaque lecture RSC remonte le client sur une nouvelle réponse serveur. Le reçu initial confirmé remplit le HTML avant JavaScript et évite le second bootstrap du profil, de la console et de la liste filtrée. Le reçu Utilisateurs sert uniquement si cet onglet est présent au premier rendu ; les visites suivantes relisent la page courante. Les mutations confirmées invalident aussi tout reçu restant. Les rafraîchissements au premier plan conservent les brouillons des panneaux.

Les mutations utilisent les handlers du SDK et ne possèdent pas de point de soumission HTML. Avant hydratation, les champs restent visibles dans un fieldset désactivé, sans formulaire natif, avec une indication pour activer JavaScript. Après hydratation, les mêmes enfants et handlers retrouvent leur formulaire POST.

Les sessions absentes ou expirées et les refus du profil proposent une reprise par `/api/user/me` de même origine. Le navigateur peut alors utiliser ses cookies `/api` et la coordination de session existante. Les droits métier restent contrôlés par les réponses du BFF.

Les tests de page asynchrone passent par le vrai SDK, le vrai proxy et un serveur HTTP piloté par le contrat. Les tests DOM historiques montent le composant client déplacé et conservent leurs interactions et assertions d’interface.
