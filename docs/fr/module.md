# Administrator_Web_Service — Présentation du module

## Session des requêtes de données — MAIR-406

Les anciens jetons du stockage navigateur ne remplacent plus le cookie utilisé
par le proxy frontend existant. Une requête ne lit, ne migre ni n'efface ce
stockage ; les headers explicites et le nettoyage de déconnexion restent
inchangés. Ce correctif client ne certifie ni droits administrateur, ni révocation
serveur, ni remplacement des commandes de session par identifiant. Ces autres
sujets d'audit restent ouverts. Aucun API/BFF ni donnée de démonstration modifié.

## Sidebar mesurée de référence — MAIR-180 / issue141

Le CSS consommateur rétablit des cibles de navigation de 44px minimum et l'ombre
de référence. Sur mobile, le bouton Fermer publié reste au-dessus de la sidebar ;
clic, clavier et Échap conservent le retour de focus. Le repère rouge Administration
et le masquage selon les droits ne changent pas. La comparaison desktop/mobile
couvre recherche/fiche utilisateur, rôles, groupe/membres et sessions/historique
sans écrire de données réelles. Les fixtures ne certifient ni droits déployés,
réinitialisation de mot de passe, révocation ni persistance durable. La version
fictive du footer et les préférences/notifications du prototype ne sont pas copiées.

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
- Les lignes de sessions distinguent Active, Expirée et Révoquée selon les champs
  publiés ; une expiration inexploitable donne un état indéterminé. Un seul timer
  local actualise les libellés à l’expiration, sans requête ni changement de compteur.
- Les confirmations locales placent le focus sur Annuler, confinent la navigation
  clavier et rendent le focus au déclencheur encore présent lors de l’annulation.
  Une action en attente garde son verrou contre double soumission et annulation ;
  aucune permission serveur n’est modifiée.
- Navigation entre modules, profil et déconnexion basés sur la session.

### Panneaux adaptatifs de la console (MAIR-372)

L’échelle par défaut est de 17px à la racine et le corps utilise la police sans
empattement du système, comme la référence locale conservée (MAIR-180). Le
sélecteur du corps conserve cette police même si la feuille partagée est chargée
après dans un build de production. Les tokens de petits textes restent standards ;
le header partagé atteint 68px par son dimensionnement en rem existant, sans
hauteur fixe ni nouveau réglage d’apparence.

Les cartes conservent l'ombre de la référence locale. Les noms longs passent
à la ligne dans l'espace disponible, y compris le titre du groupe sélectionné,
sans élargir la page. Les actions des panneaux et identifiants de groupe ne
rétrécissent pas et ne se coupent pas au milieu d'un mot. Les tableaux larges gardent leur propre défilement
horizontal. Seule la présentation du front change : les données, permissions
et opérations du contrat restent inchangées. La recette adaptative se fait
dans le navigateur à 390px, 768px et 1280px ; les tests HTML seuls ne prouvent
pas la fidélité du rendu.

Le libellé masqué de la colonne d'action des utilisateurs est positionné par
rapport à sa cellule d'en-tête, afin que son texte accessible ne déborde pas du
défilement du tableau et n'élargisse pas le document sur mobile. Le tableau et
le libellé accessible restent complets ; la page ne masque pas le débordement
horizontal pour dissimuler le problème.

### Confirmation de l’enregistrement des groupes (MAIR-440)

La console refuse les actions simultanées synchroniquement. Les champs groupes,
la sélection, les onglets de console et l’actualisation sont verrouillés jusqu’à
la fin de l’écriture et de sa relecture. Un refus conserve le brouillon pour une
tentative explicite. Une création confirmée vide son formulaire ; une modification
confirmée reprend le groupe retourné. Un échec de relecture est signalé séparément
de l’écriture réussie, avec une reprise en lecture seule : ne pas répéter une
écriture confirmée. Les réponses de fiche obsolètes ne remplacent pas la dernière
sélection. Ces garanties frontend ne prouvent ni les droits déployés, ni une
modification de credentials, ni une suppression permanente.

### Cohérence des fiches utilisateurs et rôles (MAIR-441)

Les champs et commandes utilisateurs/rôles sont verrouillés pendant les écritures
et relectures. La sélection d’une ligne utilisateur est aussi protégée à la souris
et au clavier : une réponse tardive ne mélange plus la fiche d’une personne avec
le formulaire d’une autre. Un refus conserve le brouillon pour une reprise
explicite. Modifier uniquement le profil conserve tous ses rôles ; leur remplacement
n’est envoyé qu’après changement de sélection. Ouvrir un rôle conserve son attribut
publié `can_be_deleted`, y compris false, null ou absent, sans autoriser implicitement
sa suppression. Ces protections frontend ne certifient ni les credentials, ni une
suppression permanente, ni les autorisations déployées, ni l’atomicité d’un
remplacement de rôles explicitement demandé en plusieurs opérations.

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
