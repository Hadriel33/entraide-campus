# Étapes 5 et suivantes : contact, profil, admin, gamification

Décision de Hadriel (01/10) : on enchaîne tout de suite le **palier 1 complet** (demande de contact) et les fonctionnalités qui donnent envie d'utiliser l'appli (profil, admin, gamification). Le risque de l'anti-guide (« viser le palier 3 sur une appli sans comptes ») ne s'applique pas : les comptes et les annonces sont déjà en ligne, et la demande de contact passe en premier.

## Les demandes en une phrase vérifiable
1. **Contact** : « Léa demande le contact sur l'annonce de Sam ; tant que Sam n'a pas accepté, Léa ne voit pas ses coordonnées, même dans l'onglet Réseau ; après acceptation, chacun voit les coordonnées de l'autre. »
2. **Profil** : « Je choisis un pseudo unique, j'ajoute une photo et une bio ; mes coordonnées sont dans une table à part, jamais exposées sans accord. »
3. **Admin** : « Un admin masque ou supprime n'importe quelle annonce et traite les signalements ; un étudiant ne peut pas se donner le rôle admin. »
4. **Gamification** : « Chaque entraide acceptée rapporte des points, des niveaux et des badges ; les avis ne sont possibles qu'après une mise en relation acceptée ; personne ne peut écrire ses propres points. »

## Questions et réponses retenues
| Question | Réponse | Pourquoi |
|---|---|---|
| Où sont les coordonnées ? | Table `coordonnees` (téléphone, email de contact, réseau), lisible par soi ou par quelqu'un avec une demande **acceptée** | Règle d'or n°1 protégée en base, pas à l'écran. |
| Qui fixe le destinataire d'une demande ? | Un trigger, à partir de l'auteur de l'annonce | Le client ne peut pas envoyer une demande « au nom » de quelqu'un d'autre ni viser un autre destinataire. |
| Qui accepte ? | Seul le destinataire, et seulement depuis « en attente » | Pas de retour en arrière ni d'auto-acceptation. |
| Comment stocker les points et badges ? | **Calculés** à partir des faits (demandes acceptées, avis, annonces), jamais stockés ni modifiables | Impossible à tricher : la leçon de la faille padel-snipe (points modifiables par PATCH). |
| Comment devient-on admin ? | Colonne `role` non modifiable par l'utilisateur ; un admin nomme les autres via une fonction qui vérifie `est_admin()` ; le premier admin est nommé en SQL | Pas d'élévation de privilège possible depuis le client. |
| Photo de profil ? | Supabase Storage, bucket `avatars` public en lecture, écriture limitée au dossier `<mon id>/`, 2 Mo maximum, JPG, PNG ou WebP | Chacun ne peut remplacer que sa propre photo. |
| Avis ? | Note de 1 à 5 avec un commentaire facultatif, un avis par personne et par mise en relation acceptée | Avis à la Google, mais sans faux avis. |

## Plan et vérifications
1. Tests Vitest d'abord : pseudo, coordonnées, avis, avatar, calcul des niveaux et badges.
2. Migrations 0003 (profil, coordonnées, avatars, admin), 0004 (demandes), 0005 (modération), 0006 (avis, stats). Tests SQL pour chaque règle, puis advisors.
3. Écrans : demande de contact sur l'annonce, page Demandes (reçues / envoyées), Mon profil (pseudo, photo, coordonnées), profil public, classement, espace admin.
4. Finitions : animations courtes (et respect de `prefers-reduced-motion`), messages de confirmation.
