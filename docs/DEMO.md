# La démo finale : 3 minutes, l'histoire de Léa et Sam

> Le cours : un vrai parcours, en direct sur l'appli en ligne, pas de capture ni de vidéo. Raconter l'histoire d'une personne.

## Avant de commencer (la veille au plus tard, sans toucher au code)
- [ ] Lancer `supabase/demo/rafraichir-demo.sql` dans l'éditeur SQL : les post-its de démo expirent, sans ça le tableau est vide. Il donne aussi une étape de suivi aux échanges de démo (Colette livreuse et Historique remplis).
- [ ] Deux comptes ouverts dans **deux navigateurs** (pas deux onglets du même : sinon, même session) :
  - **Sam** (photographe) : son CV PDF prêt sur le bureau, son post-it « Portraits pro pour ton LinkedIn » publié **avec une photo**.
  - **Léa** (organise le gala de son asso) : connectée, sur le tableau.
- [ ] Le **mur en direct** ouvert en mode projection dans un troisième onglet.
- [ ] Admin › « Tester maintenant » au vert (les 4 lignes, photo piégée comprise).
- [ ] Le téléphone en partage de connexion, au cas où le wifi lâche.
- [ ] Répété 3 fois, chronométré, depuis un autre ordinateur.

## Le déroulé (3 minutes)

| Temps | Qui | Ce qu'on fait | Ce qu'on dit |
|---|---|---|---|
| 0:00 | | Page d'accueil | « Léa organise le gala de son asso et cherche un photographe. Sur le campus, il y en a sûrement un, mais où ? » |
| 0:15 | Léa | Le tableau, filtre Photo | « Chaque post-it se reconnaît d'un coup d'œil : le pictogramme dit la catégorie, la forme dit le type (billet pour un covoit, polaroid pour un shooting). » |
| 0:30 | Léa | Ouvre le post-it de Sam (avec sa photo), clique « Je soutiens » puis « Demander le contact » | « Le numéro de Sam est caché. Pas juste à l'écran : la base refuse de l'envoyer. Règle d'or n°1. » |
| 0:50 | Sam | La demande est punaisée sur son bureau, il accepte | Confettis. « Sam accepte : les coordonnées apparaissent des deux côtés et une discussion s'ouvre. » |
| 1:05 | Les deux | Un message, puis un sticker Colette, reçus en direct | « Cette conversation n'est lisible que par eux deux, règle d'or n°3. » |
| 1:20 | Sam | Suivi de l'entraide : « Je m'y mets » avec le mot « retouches jeudi » | Colette met son casque et marche sur la barre. « Léa suit l'avancée comme un colis. Quand c'est livré, elle confirme Bien reçu, l'échange passe dans l'Historique et chacun laisse un avis. » |
| 1:35 | Sam | Mon profil, dépose son CV | « IA n°1 : Colette lit le CV et propose ses compétences. Sam garde ce qui est juste. Le CV n'est jamais stocké. » |
| 2:00 | Léa | Publie « RECHERCHE PHOTOGRAPHE, appelle le 06... » | Le post-it tombe et la punaise s'enfonce. « IA n°2 : Colette relit chaque post-it, photo comprise. » Ouvrir le post-it : elle propose une version sans le numéro. « Elle ne refuse pas sèchement, elle aide. Léa clique Appliquer. » |
| 2:25 | Léa | « Partager dans… » le salon Photo et vidéo | « Et comme sur un réseau social, le post-it circule : il apparaît dans le salon de tous les campus, en mini post-it cliquable. » |
| 2:45 | | Le mur en direct (projection), puis le classement | « Le campus le voit en direct, et chaque entraide fait monter sa classe. » |
| 3:00 | | | Fin. |

## Après la démo : expliquer nos choix (questions préparées)

Support de présentation : https://claude.ai/artifact/8euRdaaMk6wrVysXGWzuNk (14 slides, notes de l'orateur sous chaque slide, refaites le 26/11 pour aller droit au but). Le fil : on répond à l'appel d'offres de l'école ; notre angle, c'est « une appli où l'on revient ».
1. **Le problème** (slide 1) : « Qui peut m'aider ? », trois chiffres (talents invisibles, messages noyés dans le canal Teams, aucun suivi), puis « l'aide existe, mais personne ne la voit ».
2. **Notre réponse** (2 à 7) : Post-it campus, la genèse, notre angle en composants, le réseau du campus, Colette, la DA.
3. **La preuve** (8) : **la démo se fait sur la slide 8**.
4. **Pourquoi nous** (9 et 10) : ce que le canal Teams et un site d'annonces n'ont pas ; qui porte le projet.
5. **Clés en main** (11 à 14) : en ligne en 7 jours, les 4 IA déjà branchées, la sécurité déjà en place, et la suite (maintenance, appli mobile, d'autres campus), puis « Merci ! À vos questions. »

Les notes de la slide 8 contiennent une **antisèche** de toutes les fonctionnalités, pour répondre à « et sinon, il y a quoi ? » sans rien oublier.

- **Notre palier** : les 3 (ça tourne, ça discute, ça matche). Le palier 1 testé à deux comptes, les règles d'or prouvées en base par environ 145 vérifications SQL, plus un robot qui parcourt le site en ligne chaque jour.
- **Nos IA** : les deux demandées (le profil depuis le CV, la relecture des post-its, photo comprise) et deux bonus (Colette rédige un post-it, le tri « Pour moi »). Voir `docs/IA-DEFENSE.md` et la page « Les IA de Colette » de l'appli (besoin, humain qui valide, plan si ça rate, aucune clé).
- **Une faille réparée** : l'erreur d'une demande de contact laissait deviner si une annonce existait (un « oracle »). Correction : connexion exigée avant toute vérification, message neutre, test SQL qui rejoue l'attaque (voir `docs/securite/FAILLES.md`).
- **Avec une séance de plus** : les notifications par email (Brevo), pour savoir qu'on a reçu une demande sans ouvrir l'appli ; puis, si l'école nous choisit, une appli mobile (elle s'installe déjà sur l'écran d'accueil du téléphone).

## Plan B si quelque chose casse en direct
- **L'IA est lente** : continuer le parcours, revenir à l'annonce à la fin (la modération tourne en arrière-plan).
- **Le réseau tombe** : partage de connexion du téléphone. L'appli est en ligne sur Vercel, rien ne tourne sur l'ordinateur.
- **Une page plante** : « Réessayer » (Colette débordée) ; sinon, recharger.
