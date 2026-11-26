# Failles trouvées, corrigées, et le test qui le prouve

> Le cours : « Pour chaque faille, note ce que tu as fait, ce que tu as vu et pourquoi c'est grave. Corrige côté base et écris un test qui la vérifie. Refais l'attaque toi-même. »
> Tout est vérifié **en base** (RLS, triggers, droits par colonne), pas seulement caché à l'écran. Environ 145 vérifications SQL rejouables dans `supabase/tests/` (84 au 02/10, puis une série par fonction ajoutée), plus 215 tests Vitest et un robot qui parcourt le site en ligne chaque jour.

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

### Ajouts depuis le 22/10 (côté réseau social) : les nouvelles portes, et pourquoi elles tiennent
| Attaque | Règle | Pourquoi elle échoue | Test |
|---|---|---|---|
| Écrire ou lire dans le salon d'un autre campus ou d'une autre classe | n°3 (salons) | `peut_lire_salon` en base, pour la lecture comme pour l'écriture | `0025` |
| Écrire un numéro ou un email dans un commentaire ou un salon | n°1 | `contient_coordonnees` refuse le message en base, même par l'API | `0025` |
| Signer un message ou un commentaire au nom d'un autre | Identité | L'auteur est imposé par le trigger (`auth.uid()`) | `0025` |
| Mentionner quelqu'un sous un post-it caché pour lui en montrer le contenu | Vie privée | Pas de notification de mention sur un post-it non public ; 5 mentions au plus | `0027` |
| Porter une tenue de Colette pas encore gagnée (micro, flamme, étoilé) | Triche | Conditions recalculées depuis les vraies stats (commentaires, réactions reçues, série) | `0027` |
| Soutenir son propre post-it, ou deux fois le même | Triche | Trigger et clé unique ; les soutiens ne rapportent aucun point | `0028` |
| S'ajouter soi-même à un post-it de groupe, dépasser 4 personnes | n°2 | Seul le créateur invite, 3 membres au plus, l'invité doit accepter | `0029` |
| Modifier un post-it de groupe avant d'avoir accepté l'invitation, ou le supprimer en étant membre | n°2 | Policy « membres acceptés » pour modifier ; suppression réservée au créateur | `0029` |
| Voir les coordonnées du créateur d'un post-it de groupe alors qu'un autre membre a accepté | n°1 | Celui qui accepte devient le destinataire : seules ses coordonnées sont montrées | `0029` |
| Lire une discussion de groupe sans en faire partie (ou en simple invité) | n°3 | Lecture réservée au demandeur, à celui qui a accepté et à l'équipe qui a dit oui | `0029` |
| Poser la photo d'un post-it dans le dossier d'un autre, ou un chemin bidon (`../`) | n°2 / Stockage | Policies Storage par dossier ; trigger qui vérifie le dossier ; chemin contrôlé par la base | `0031` |
| Publier une photo choquante ou avec un numéro dessus | Modération | L'IA n°2 relit la photo avec le texte ; changer de photo relance la relecture | `0031`, « Tester maintenant » (photo piégée) |
| Lire les signalements des autres, signaler en masse ou son propre message | Modération | Signalements visibles de leur auteur et de l'admin ; 20 par jour ; pas sur ses messages | `0031` |
| Partager un post-it caché dans un salon, ou glisser un post-it dans la discussion d'autrui | n°1 / n°3 | Le partage exige que le post-it soit visible et que le salon ou la discussion soit à moi | `0033` |
| Lire un post-it masqué grâce à un vieux partage | Modération | Le message reste, mais la RLS des annonces ne renvoie plus le post-it (« Post-it indisponible ») | `0033` |
| Avancer le suivi d'une entraide à la place de celui qui aide, reculer une étape, glisser un numéro dans le petit mot | n°1 / Triche | Aucune écriture directe dans `suivis_entraide` : seule `avancer_entraide` écrit, après avoir vérifié qui aide, l'ordre des étapes et `contient_coordonnees` | `0034` |
| Se dire « Bien reçu » soi-même, ou avant la livraison ; lire le suivi d'un échange qui n'est pas le sien | n°3 / Triche | `confirmer_entraide` réservée à celui qui reçoit, seulement à l'étape « livré » ; lecture limitée aux participants de l'échange | `0034` |
| Épuiser le plafond des IA en ajoutant de fausses consommations, ou lire la dépense | Coût | `ia_usages` : écriture réservée au serveur (clé secrète), lecture à l'admin ; `ia_reglages` : seul l'admin lit et règle le plafond, dans les bornes 0 à 1000 € | `0035` |
| Lire les suggestions des autres, en envoyer au nom de quelqu'un, se déclarer « faite », ou inonder la boîte | Vie privée, intégrité | `suggestions` : j'écris seulement en mon nom (statut « nouvelle »), je lis les miennes, l'admin lit tout et change seul le statut ; 5 suggestions par 24 h vérifiées en base ; visiteur non connecté : aucun droit | `0038` |
| Choisir une tenue de Colette inventée (ou verrouillée) en appelant l'API directement | Intégrité | Listes fermées en base (contraintes CHECK), les nouveautés de 0037 sont libres ; les pièces rares restent vérifiées par le trigger de la garde-robe | `0037` |
| S'inscrire avec l'adresse de l'école de quelqu'un d'autre | Identité | **Fermée le 19/11** : confirmation d'email activée (Brevo en SMTP). Sans clic sur le lien reçu dans la boîte de l'école, pas de connexion | Test à la main (fenêtre privée) |

### Security Advisor de Supabase (19/11) : 0 erreur, 28 avertissements, tous voulus
Les 28 avertissements sont du même type : « fonction SECURITY DEFINER appelable ». Chacune vérifie l'appelant elle-même :
| Fonctions | Pourquoi c'est voulu |
|---|---|
| `definir_role`, `changer_campus` | Commencent par `if not est_admin() then raise` : un étudiant est refusé |
| `avancer_entraide`, `confirmer_entraide`, `repondre_demande` | Vérifient qui aide, qui reçoit, qui fait partie de l'équipe (tests `0029`, `0034`) |
| `est_admin`, `est_equipe`, `cible_visible`, `est_membre_annonce`, `peut_lire_salon` | Utilisées par les règles RLS : doivent être appelables par les connectés, ne renvoient que vrai ou faux |
| `fil_campus`, `classement_campus`, `stats_profil`... | Lectures qui appliquent les mêmes filtres que les pages (modération, consentement au fil) |
| `pseudo_disponible`, `stats_publiques` (publiques) | L'inscription doit vérifier un pseudo avant d'avoir un compte ; l'accueil montre des totaux sans aucun nom |
Limite assumée : la protection contre les mots de passe divulgués est réservée à l'offre Pro ; on impose 8 caractères minimum.

### À rejouer avant le 26/11 (éditeur SQL Supabase, chaque fichier finit par « OK : … »)
`0023`, `0024`, `0025`, `0027`, `0028`, `0029`, `0031`, `0033`, `0034`, `0035`, `0036`, `0037`, `0038` dans `supabase/tests/` (`0034` et `0035` rejoués en ligne le 19/11 : 9 et 6 tests réussis). Puis, à la main avec deux comptes : coordonnées invisibles avant accord (y compris dans l'onglet Réseau du navigateur), impossible de modifier le post-it de l'autre, conversation illisible pour un troisième compte.

## À compléter le 26 novembre (chasse aux failles en classe)
| # | Trouvée par | Ce qu'il a fait | Ce qu'il a vu | Gravité | Correction | Test ajouté | Attaque rejouée ? |
|---|---|---|---|---|---|---|---|
| | | | | | | | |
