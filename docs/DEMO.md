# La démo finale : 3 minutes, l'histoire de Léa et Sam

> Le cours : un vrai parcours, en direct sur l'appli en ligne, pas de capture ni de vidéo. Raconter l'histoire d'une personne.

## Avant de commencer (la veille au plus tard, sans toucher au code)
- [ ] Deux comptes de démo ouverts dans **deux navigateurs** (pas deux onglets du même : sinon, même session) :
  - **Sam** (ESP, photographe) : son CV PDF prêt sur le bureau, son annonce déjà publiée « Photos pour vos événements d'asso ».
  - **Léa** (ESD, organise le gala de son asso) : connectée, sur le mur.
- [ ] Une vingtaine de vraies annonces sur le mur (voir `docs/CONTENU-DEMO.md`), les deux comptes dans le fil du campus.
- [ ] Le **mur en direct** ouvert en mode projection sur un troisième onglet.
- [ ] Le téléphone en partage de connexion, au cas où le wifi lâche.
- [ ] Répété 3 fois, chronométré, depuis un autre ordinateur.

## Le déroulé (3 minutes)

| Temps | Qui | Ce qu'on fait | Ce qu'on dit |
|---|---|---|---|
| 0:00 | | Page d'accueil | « Léa organise le gala de son asso et cherche un photographe. Sur le campus, il y en a sûrement un, mais où ? » |
| 0:15 | Léa | Mur des annonces, filtre Photo | « Chaque annonce est un post-it, la couleur dit la famille. Seuls les étudiants ESD et ESP peuvent entrer. » |
| 0:35 | Léa | Ouvre le post-it de Sam, « Demander le contact » | « Le numéro de Sam est caché. Pas juste à l'écran : la base refuse de l'envoyer. C'est notre règle d'or n°1. » |
| 0:55 | Sam | Bureau : la demande de Léa est punaisée dans « À traiter », il accepte | Confettis, Colette saute. « Sam accepte : les coordonnées apparaissent des deux côtés et une discussion s'ouvre. » |
| 1:15 | Les deux | Un message envoyé dans la discussion, reçu en direct de l'autre côté | « Cette conversation n'est lisible que par eux deux, règle d'or n°3. » |
| 1:35 | Sam | Mon profil, dépose son CV | « IA n°1 : Colette lit le CV et propose ses compétences. Sam garde ce qui est juste. Le CV n'est jamais stocké. » |
| 2:00 | Léa | Publie « RECHERCHE PHOTOGRAPHE, appelle le 06... » | « IA n°2, celle qu'on a inventée. » Ouvrir l'annonce : Colette propose une version corrigée, sans le numéro. « Elle ne refuse pas sèchement : elle aide. Léa clique Appliquer. » |
| 2:30 | | Le mur en direct (projection) | Le post-it de Léa tombe sur le mur. « Et le campus le voit en direct. » |
| 2:45 | | Classement des classes | « Chaque entraide fait monter sa classe. Sam vient de rapporter un bonus croisement ESD × ESP. » |
| 3:00 | | | Fin. |

## Après la démo : expliquer nos choix (questions préparées)

Support de présentation (12 slides, notes de l'orateur sous chaque slide) : https://claude.ai/artifact/8euRdaaMk6wrVysXGWzuNk

- **Notre palier** : les 3 (ça tourne, ça discute, ça matche). Le palier 1 testé à deux comptes, les règles d'or prouvées en base par 84 vérifications SQL.
- **Nos deux IA** : voir `docs/IA-DEFENSE.md` (besoin, humain qui valide, plan si ça rate, aucune clé).
- **Une faille réparée** : l'erreur d'une demande de contact laissait deviner si une annonce existait (un « oracle »). Correction : connexion exigée avant toute vérification, message neutre, test SQL qui rejoue l'attaque (voir `docs/securite/FAILLES.md`).
- **Avec une séance de plus** : l'IA qui aide à rédiger l'annonce dès le départ, et les notifications par email.

## Plan B si quelque chose casse en direct
- **L'IA est lente** : continuer le parcours, revenir à l'annonce à la fin (la modération tourne en arrière-plan).
- **Le réseau tombe** : partage de connexion du téléphone. L'appli est en ligne sur Vercel, rien ne tourne sur l'ordinateur.
- **Une page plante** : « Réessayer » (Colette débordée) ; sinon, recharger.
