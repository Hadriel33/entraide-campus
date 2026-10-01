# Notre méthode de travail (pour la présentation)

Ce document raconte **comment** on construit l'appli avec l'IA. Il est mis à jour à chaque séance.
Le détail jour par jour est dans [JOURNAL.md](JOURNAL.md), le plan dans [PLAN.md](PLAN.md).

## 1. Le principe : l'humain décide, l'IA exécute et documente
- **Moi (Hadriel)** : je choisis le produit, les priorités, l'IA inventée, et je valide chaque plan avant qu'on code.
- **Claude (Claude Code, desktop)** : il pose ses questions, propose un plan découpé, écrit le code et les tests, pousse sur GitHub et vérifie que tout est en ligne.
- **La chaîne** : Claude écrit le code, GitHub le sauvegarde, Vercel le met en ligne, Supabase stocke les données.

## 2. Les garde-fous qu'on s'est donnés
| Garde-fou | Où | Pourquoi |
|---|---|---|
| Fiche d'identité relue à chaque demande | `CLAUDE.md` | Sans cadre, l'IA ajoute ce qu'on n'a pas demandé. |
| « Ce que tu ne touches jamais » écrit noir sur blanc | `CLAUDE.md` | Les secrets, la RLS et les dépendances ne bougent pas sans mon accord. |
| Plan en étapes, chacune avec son moyen de vérification | `PLAN.md` | On ne passe à l'étape suivante que si c'est vert **en ligne**. |
| Skills du projet | `.claude/skills/` | Des savoir-faire réutilisables, appelés avec `/nom`. |
| Dépôt séparé et public, aucun secret dedans | GitHub | Les clés vont dans les variables Vercel. Une clé visible coûte 5 points. |

## 3. Réutiliser ce qu'on sait déjà : les skills
J'avais déjà un projet perso (padel-snipe, Next.js + Supabase + Vercel) avec beaucoup de documentation en Markdown. Plutôt que de repartir de zéro :
1. Un agent Claude a passé en revue les 81 fichiers `.md` du projet et les a classés : réutilisables ou spécifiques au padel.
2. On a gardé ce qui est générique : sécurité Supabase (avec une vraie faille corrigée en septembre), tests, design anti-« look IA », gamification sans triche.
3. On l'a transformé en **7 skills** adaptés au brief :

| Skill | Usage | Origine |
|---|---|---|
| `nouvelle-etape` | La boucle de travail à chaque fonctionnalité | Méthode du cours |
| `supabase-rls-securite` | RLS, les 3 règles d'or, l'admin, la chasse aux failles | Audit sécurité padel-snipe + cours |
| `fonctionnalite-ia` | Brancher les 2 IA proprement | Consignes IA du cours |
| `tests-comptes` | Tests Vitest, comptes de test, cas piégés | Docs de test padel-snipe |
| `anti-ia-design` | Éviter le look « généré par IA » | Checklist design padel-snipe |
| `ui-ux-pro-max` | Base de données de styles, couleurs, polices | Skill open source déjà utilisé |
| `gamification-badges` | Badges, avis, historique (bonus) | Programme de récompenses padel-snipe |

## 4. La boucle de travail (skill `nouvelle-etape`)
1. **Cadrer** : reformuler la demande en une phrase vérifiable, puis l'IA pose ses questions **avant** de coder.
2. **Planifier** : 2 à 5 sous-étapes, chacune avec son moyen de vérifier. Je relis et je corrige.
3. **Test d'abord** : le test de la règle est écrit avant le code, puis on code jusqu'à ce qu'il passe sans toucher au test.
4. **Vérifier** : build, tests, puis test à la main (téléphone, 2e compte, saisie bizarre).
5. **Sauvegarder** : commit et push. Vercel redéploie, et on vérifie sur l'adresse en ligne.
6. **Documenter** : une ligne dans le journal, et on coche l'étape dans le plan.
7. **Si ça coince** : après 2 essais ratés, on revient en arrière et on reformule.

## 5. Les décisions et leurs raisons
| Date | Décision | Pourquoi |
|---|---|---|
| 01/10 | Next.js 16 + Supabase + Vercel | La chaîne imposée par le cours, et la stack que je maîtrise déjà (padel-snipe). |
| 01/10 | Dépôt GitHub **public** et séparé du reste de mes cours | Le prof doit voir le code, et aucun secret ne doit s'y trouver. |
| 01/10 | Supabase dans une **organisation gratuite** séparée | L'organisation padel-snipe est payante (10 $/mois par projet). Ça évite aussi de mélanger les deux projets. |
| 01/10 | IA inventée = **modération des annonces** + espace admin | Besoin réel sur une appli ouverte à tout le campus. Un humain valide, et il y a un plan si l'IA tombe en panne. Elle protège aussi la règle d'or n°1 (pas de coordonnées dans le texte). |
| 01/10 | Consigne du prof : des skills avec **références et modèles de code**, et un front **migrable vers n'importe quelle référence** | Chaque skill a un dossier `modeles/` copié du vrai code (migration + RLS, test RLS, Server Action, test de règle, thème). Le front n'utilise que des jetons (`globals.css`) et des composants partagés (`src/components/ui`). Nouveau skill `adapter-front`, et un test qui refuse toute couleur en dur. |
| 01/10 | Recherche avant de designer : écoles, concurrents, 3 pistes de DA | Un agent a fait la recherche web (ESD et ESP, Groupe ESP-ESD / AD Education, campus Victor Hugo, concurrents, catégories réalistes). Résultat dans `docs/DA.md`. La DA reste au choix de Hadriel. |
| 01/10 | Étape 3 : test d'abord, puis base, puis code | 9 tests de validation écrits et vus en échec avant le code. Table `profils` + RLS + trigger, testée en SQL avec 2 comptes fictifs (transaction annulée). Fiche de l'étape : `docs/etapes/03-comptes.md`. |
| 01/10 | DA V2 « dashboard SaaS inspiré ESD/ESP » : maquettes avant le code | Codes couleurs et polices relevés **dans le CSS réel** des deux sites (pas devinés). Une planche de maquettes (kit UI, tableau de bord, mobile) où les 3 pistes partagent la même interface et ne diffèrent que par les jetons. On choisit sur pièce, puis `adapter-front` applique la piste au vrai code. |
| 01/10 | Piste D ajoutée : la nouvelle DA de l'ESP repérée sur Instagram | Hadriel a signalé la refonte. Relevé visuel du compte @esp_ecole (cookies optionnels refusés, sans connexion). Le rouge est foncé à `#D7141A` pour passer le contraste AA sous du texte blanc. Même interface, nouveaux jetons : la planche le démontre sans réécrire un seul écran. |
| 01/10 | Piste E = synthèse A + D | Choix itératif sur maquettes : 3 pistes, puis D (nouvelle charte), puis E (synthèse demandée). Le même écran est rejoué avec d'autres jetons : chaque itération coûte quelques lignes, pas une refonte. |
| 01/10 | DA E appliquée au vrai site en ne touchant que les jetons et les composants `ui` | Preuve de la portabilité : `globals.css` (jetons + utilitaire `titre-charte`), polices via `next/font`, et les pages reprennent `TitrePage`, `Badge`, `Bouton`. Le test `front-portable` reste vert. |
| 01/10 | Étape 4 : identifiants d'annonce en UUID, et « annonce introuvable » renvoyé aussi quand ce n'est pas la nôtre | On ne révèle pas l'existence d'une annonce archivée d'un autre. On ne peut pas énumérer les annonces en changeant le numéro dans l'URL (anticipation de la chasse aux failles). |
| 01/10 | Les tests de bout en bout avec de vrais comptes sont faits par Hadriel | L'IA ne crée pas de comptes ni ne se connecte sur le site en ligne (règle de sécurité). Elle teste la sécurité en SQL avec des comptes fictifs, et Hadriel teste le parcours à la main avec 2 comptes. |
| 01/10 | Hadriel accélère : contact, profil (pseudo, photo), rôle admin et gamification dans la foulée | Ordre imposé : d'abord la demande de contact (le cœur du palier 1), puis le reste. Une fiche commune (`docs/etapes/05-...md`), des tests d'abord (24 nouveaux), 4 migrations et **14 tests de sécurité SQL** en une transaction. |
| 01/10 | Points, niveaux et badges **calculés**, jamais stockés | Ils sont déduits des faits protégés (demandes acceptées, avis) par `stats_profil()` en SQL, et `progression.ts` (testé) fait le calcul. Personne ne peut s'attribuer des points : c'est la leçon de la faille padel-snipe. On compte des **personnes différentes** aidées pour que deux amis ne puissent pas farmer. |
| 01/10 | Rôle admin non modifiable par l'utilisateur | Droits par colonne (`role` exclu des colonnes modifiables), fonction `definir_role()` réservée aux admins, premier admin nommé en SQL. Tests : élévation par UPDATE et par la fonction, les deux bloquées. |
| 01/10 | Destinataire d'une demande et cible d'un avis imposés par la base | Les triggers écrasent ce que le client envoie. Testé : un destinataire détourné est remis à l'auteur de l'annonce, un avis visant un tiers est redirigé vers la bonne personne. |
| 01/10 | Animations courtes en CSS pur, aucune librairie | `apparition` en cascade, `souleve`, `presse`, `pop`, et un toast de confirmation. Tout est coupé si l'utilisateur active `prefers-reduced-motion`. |
| 01/10 | IA sans clé ni coût : Vercel AI Gateway (jeton OIDC du projet, 5 $ de crédits gratuits par mois) | Test réel : Claude est bloqué sur l'offre gratuite (403). Hadriel choisit **Gemini 2.5 Flash** (gratuit, lit les PDF) plutôt que de payer pour Claude Haiku. Le choix est documenté dans `docs/etapes/06-07-fonctionnalites-ia.md`. |
| 01/10 | IA n°1 : le CV n'est jamais stocké, l'étudiant valide chaque compétence | PDF lu en mémoire, réponse en JSON avec schéma zod, nettoyage testé, écran de relecture (cocher, décocher, ajouter). Si l'IA est en panne, saisie à la main. |
| 01/10 | IA n°2 : la modération ne peut être écrite que par le serveur ou un admin | Un trigger remet « en attente » toute annonce créée ou modifiée par un utilisateur, et refuse qu'il touche aux colonnes de modération (4 tests SQL). « Refus probable » masque l'annonce en attendant l'admin, qui a toujours le dernier mot. Sans clé secrète, tout reste en attente d'un humain : on échoue du côté sûr. |
| 01/10 | Tests réels sur cas piégés avant de brancher l'IA | CV avec injection cachée, annonce avec téléphone, arnaque à l'IBAN, texte haineux avec tentative de manipulation : tout est bien classé (`docs/ia/tests-reels-2026-10-01.md`). |
| 01/10 | Chasse aux failles à blanc avant la séance 5, puis CI GitHub | 3 faiblesses trouvées et corrigées le jour même (message d'erreur trop bavard, oracle d'existence des annonces, en-têtes de sécurité manquants), 1 réglage laissé à Hadriel (mot de passe minimum dans Supabase). Rapport : `docs/securite/chasse-aux-failles-a-blanc.md`. La CI rejoue lint, tests, build, typage et recherche de clés à chaque push. |
| 01/10 | Palier 2 : conversation = demande acceptée, messages non modifiables, en direct (Realtime) | Pas de message avant l'accord, l'auteur est imposé par la base, et Realtime respecte la RLS (chacun ne reçoit que ses conversations). Règle d'or n°3 testée (6 tests SQL). |
| 01/10 | Palier 3 : matching simple et explicable plutôt qu'une « boîte noire » | Score à partir de mes catégories et de mes compétences validées (issues du CV, donc l'IA n°1 nourrit le palier 3). Chaque suggestion dit pourquoi. Mots entiers seulement (Java n'est pas JavaScript). 6 tests. |
| 01/10 | Objectif « publiable sur le campus » : préparation du lancement public | Anti-spam en base (limites par jour), RGPD (page Confidentialité, suppression du compte en cascade), mot de passe oublié, finitions (chargement, 404, erreur, aperçu de partage). 5 tests SQL. Checklist : `docs/LANCEMENT.md`. |
| 01/10 | Appli réservée aux emails de l'école, école déduite du domaine | Décision de Hadriel : @mail-esd.com et @mail-esp.com seulement. On ne demande plus l'école, donc on ne peut plus mentir dessus. Imposé en base (inscription et changement d'email), avec 5 tests contre les domaines imités. **Limite connue** : tant que la confirmation d'email est désactivée (SMTP pas branché), quelqu'un peut taper une adresse de l'école qui n'est pas la sienne. La confirmation par email fermera ce trou. |
| 01/10 | Lot « ce qui fait la différence », choisi par Hadriel parmi 8 idées (il a tout pris) | Notifications en direct (créées seulement par la base), accueil guidé en 4 étapes, recherche plein texte sans accents, compteur d'impact public (agrégats seulement), expiration des annonces avec relance automatique quotidienne (pg_cron) et « Prolonger » contrôlé par la base, quartier et tram de Bordeaux, favoris privés, défi de la semaine, titres de spécialité, classement de la semaine. 18 tests Vitest et 13 tests SQL de plus. |
| 01/10 | Après l'acceptation, la discussion s'ouvre automatiquement | Demande de Hadriel : celui qui accepte arrive dans le chat, l'autre reçoit une notification qui l'y emmène. Avant l'accord, les coordonnées restent dans une table que la base refuse de transmettre. |
| 01/10 | Gamification repoussée après le palier 1 (décision initiale, remplacée le jour même) | Anti-guide du cours : ne pas viser le palier 3 sur une appli sans comptes. |
| 01/10 | Lot UX : barre d'onglets en bas sur mobile, transition fluide carte → détail (View Transitions natives), filtres avancés avec pastilles, palette Ctrl+K, favori instantané, partage natif | Hadriel voulait « un truc sympa » : on a choisi ce qui fait gagner du temps (filtres, raccourcis, pouce sur mobile) plutôt que des effets décoratifs. Aucune librairie ajoutée, et les animations se coupent si l'utilisateur a demandé « réduire les animations ». |
| 01/10 | DA V3 : la couleur code la famille de catégorie, et une « couche » fine décalée remplace l'ombre floue | Coller à la nouvelle charte ESP (bandeaux colorés superposés) tout en gardant un sens : la couleur aide à repérer le type d'annonce d'un coup d'œil. Jamais de couleur seule, toujours avec le texte. |
| 01/10 | DA V4 : une seule métaphore, le tableau d'affichage (post-it, scotch, punaises), et un mur en direct pour la démo | Une DA qui « s'amuse » mais reste lisible : la métaphore explique l'appli (on affiche ce qu'on propose ou cherche). Le temps réel ne sert qu'à relancer la lecture serveur : la RLS reste la seule porte d'entrée des données. |

## 6. Ce qui n'a pas marché (et comment on l'a contourné)
| Date | Problème | Solution |
|---|---|---|
| 01/10 | Le connecteur Vercel de Claude n'a pas le droit de créer un projet (erreur 403) | Hadriel a connecté une fois la CLI Vercel (`vercel login` : un lien à valider, sans mot de passe donné à l'IA). Claude pilote ensuite Vercel en ligne de commande : création du projet, variables, déploiements. |
| 01/10 | Ni Claude in Chrome ni le navigateur intégré n'étaient connectés à Vercel et Supabase, et l'IA ne saisit jamais de mot de passe | Hadriel se connecte une fois lui-même dans le navigateur intégré (la session reste), Claude fait la suite. |
| 01/10 | Le premier projet Vercel a été branché sur le mauvais dépôt (`m1-data`, mes cours) au lieu de `entraide-campus` : les fichiers étaient lisibles publiquement sur m1-data.vercel.app | Détecté par Claude en vérifiant les déploiements côté GitHub, puis par un test d'accès (`curl` → 200). Projet Vercel supprimé et réimporté depuis le bon dépôt. Leçon : toujours vérifier **quel dépôt** est déployé et **ce qui est public**. |
| 01/10 | Variable `NEXT_PUBLIC_...` refusée en type « Secret » sur Vercel | Une variable `NEXT_PUBLIC_` est envoyée au navigateur, elle n'est donc pas secrète : type Config. Les vrais secrets (clé IA) n'auront jamais ce préfixe. |
| 01/10 | Envoi d'emails : le SMTP gratuit de Supabase n'envoie qu'aux membres de l'équipe du projet (vérifié dans la doc officielle) | Confirmation d'email désactivée pendant le développement. On branchera Brevo (SMTP perso) avant d'ouvrir l'appli au campus. |
| 01/10 | Titres non condensés en ligne : `font-stretch` sans effet avec next/font | Vu en vérifiant le rendu sur le site déployé. Correctif : `font-variation-settings: "wdth" 78`. |
| 01/10 | `tsc` en erreur sur `PageProps<"/annonces/[id]">` avant le build | Les types de routes de Next.js 16 sont générés au build : on lance `tsc` après `next build`. |
| 01/10 | Advisors Supabase : fonctions de trigger appelables via l'API | Fermées (migration 0007). Les autres alertes concernent des fonctions appelées volontairement, qui vérifient elles-mêmes les droits : documenté. |
| 01/10 | Vitest ne résolvait pas l'alias `@/` | Alias ajouté dans `vitest.config.ts`. |
| 01/10 | Caractère étoile refusé par le test front-portable (c'est un pictogramme) | Étoiles en SVG. Le garde-fou a fonctionné. |
| 01/10 | Claude inaccessible sur l'offre gratuite de la passerelle Vercel | Test de 6 modèles gratuits, puis choix de Gemini 2.5 Flash par Hadriel. Le code reste indépendant du modèle (une constante à changer). |
| 01/10 | Lint React 19 : setState dans un effet et Date.now() pendant le rendu | Compteur de la cloche calculé (valeur serveur + notifications reçues en direct), calcul de date déplacé dans une fonction de la bibliothèque. |
| 01/10 | La copie locale de padel-snipe n'était pas à jour (22 commits de retard) | Lecture directe de la version GitHub (`origin/main`), sans toucher à la branche locale. |
| 01/10 | L'effet de survol des cartes ne marchait pas : l'animation d'apparition gardait `transform: none` | Animation passée sur la propriété CSS `translate`, le survol garde `transform`. Repéré en vérifiant le rendu en local. |
