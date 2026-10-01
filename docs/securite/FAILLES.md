# Failles trouvées, corrigées, et le test qui le prouve

> Le cours : « Pour chaque faille, note ce que tu as fait, ce que tu as vu et pourquoi c'est grave. Corrige côté base et écris un test qui la vérifie. Refais l'attaque toi-même. »
> Tout est vérifié **en base** (RLS, triggers, droits par colonne), pas seulement caché à l'écran. 84 vérifications SQL rejouables dans `supabase/tests/`.

## Failles réelles trouvées pendant notre chasse à blanc (01/10/2026)
| # | Ce qu'on a fait | Ce qu'on a vu | Pourquoi c'est grave | Correction | Test qui la rejoue |
|---|---|---|---|---|---|
| 1 | Créer une demande de contact sans être connecté, avec un identifiant d'annonce au hasard | Le message d'erreur changeait selon que l'annonce existe ou non | Un « oracle » : on peut deviner quelles annonces existent, même archivées | Connexion exigée **avant** toute vérification, message neutre (migration 0009) | chasse à blanc, attaque rejouée après le correctif |
| 2 | Publier une annonce sans être connecté | Refusé, mais l'erreur citait la fonction interne `est_admin` | Ça dévoile le fonctionnement interne | Plus aucun droit d'écriture pour les visiteurs, message neutre (0009) | chasse à blanc |
| 3 | Lire les conseils de sécurité de Supabase | Les fonctions de trigger étaient appelables directement par l'API | On pouvait déclencher une logique interne hors contexte | Droit d'exécution retiré (migration 0007) | rapport des « advisors » Supabase |
| 4 | Ouvrir l'appli dans une iframe d'un autre site | Seul HSTS était en place | Clickjacking : faire cliquer sur « Accepter » à l'insu de l'étudiant | `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy` (`next.config.ts`) | en-têtes vérifiés en ligne |
| 5 | S'inscrire avec 7 caractères de mot de passe par l'API | Accepté par Supabase | Comptes faciles à pirater | Minimum 8 dans Supabase Auth, en plus du formulaire | appel direct : `weak_password` |
| 6 | Regarder le mur après le campus de démo (02/10) | L'annonce « COURS DE MATHS », classée « à vérifier » par l'IA, affichait un numéro et un email à tout le campus | Contourne la règle d'or n°1 : des coordonnées visibles sans accord | Une annonce « à vérifier » n'est visible que de son auteur et de l'admin, et on ne peut plus y demander le contact (migration 0023) | `supabase/tests/0023_annonces_a_verifier_cachees.sql` (6 tests) |

## Les attaques qui échouent (et doivent continuer d'échouer)
| Attaque (comme en séance 5) | Règle | Pourquoi elle échoue | Test |
|---|---|---|---|
| Voir le numéro de Sam avant qu'il accepte (y compris dans l'onglet Réseau) | Règle d'or n°1 | Les coordonnées sont dans une table à part, la RLS ne les renvoie qu'après acceptation | `0003_0006` |
| Se donner le droit en modifiant le destinataire d'une demande | n°1 | Le trigger impose le vrai destinataire (l'auteur de l'annonce) | `0003_0006` |
| Accepter sa propre demande | n°1 | Seul le destinataire peut répondre | `0003_0006` |
| Modifier ou supprimer l'annonce d'un autre, publier au nom d'un autre | Règle d'or n°2 | RLS : `auth.uid() = auteur_id` | `0002` |
| Valider soi-même la modération de son annonce, écrire soi-même la « correction proposée » | n°2 | Colonnes réservées au serveur et aux admins (trigger) | `0008`, `0021` |
| Lire une conversation dont on ne fait pas partie, écrire dedans | Règle d'or n°3 | RLS sur les deux participants, messages non modifiables | `0010` |
| Se nommer admin (métadonnées d'inscription, mise à jour du profil) | Rôles | Le rôle n'est pas modifiable par l'utilisateur, seul `definir_role` (admin) le change | `0003_0006` |
| S'inscrire avec un email hors école ou une imitation (`@mail-esd.com.evil.fr`) | Accès | Trigger à l'inscription, domaine exact | `0012` |
| Spammer annonces, demandes, messages, propositions de classe | Abus | Limites en base (5 annonces par jour, 20 demandes, 30 messages en 10 minutes, 3 classes) | `0011`, `0018` |
| Porter une tenue de Colette pas encore gagnée, rejoindre la classe de l'autre école | Triche | Triggers qui recalculent les conditions depuis les vraies stats | `0017`, `0018` |
| Apparaître dans le fil du campus sans son accord, ou cocher le fil d'un autre | Vie privée | Double consentement exigé par la fonction, mise à jour limitée à soi | `0020` |
| Chercher une clé secrète dans le code GitHub ou dans le JavaScript du site | Clés | Aucune clé : IA par jeton OIDC Vercel, clé Supabase secrète uniquement côté serveur ; la CI cherche des clés à chaque push | CI GitHub |
| Changer `/annonces/12` en `/13` | Énumération | Identifiants UUID, « introuvable » identique pour une annonce cachée ou inexistante | chasse à blanc |

## À compléter le 26 novembre (chasse aux failles en classe)
| # | Trouvée par | Ce qu'il a fait | Ce qu'il a vu | Gravité | Correction | Test ajouté | Attaque rejouée ? |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
