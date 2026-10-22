# Étape 8 : les retours du prof (22/10/2026)

## Ce que le prof a dit (rapporté par Hadriel)
- Il a aimé la DA et Colette. Le problème est l'**organisation** : trop de choses, mal rangées.
- Pousser la **gamification** façon réseau social : un endroit où on a envie de voir ce qui se passe et de **revenir**.
- Que tout soit **lisible**.
- Des **formes de post-it** différentes selon le type d'annonce (cours : classique ; covoiturage, coloc… : autre forme), et des couleurs par catégorie.
- **Plus d'ESD / ESP** à l'écran : l'ESD rejoint l'ESP (rentrée 2027). Les deux adresses email restent valables. À la place : une **compétition entre campus ESP**.

## Demandes vérifiables et décisions
| Demande en une phrase vérifiable | Décision retenue | Pourquoi |
|---|---|---|
| « Je ne vois plus ESD nulle part, sauf pour l'email à l'inscription » | Test Vitest `campus.test.ts` qui refuse `ESD` dans le code de l'interface (exceptions : email, mention légale) | Garde-fou permanent, comme celui des jointures |
| « Je choisis mon campus à l'inscription et je ne peux pas le changer moi-même » | Colonne `campus` (6 campus ESP), pas de droit de modification ; seul un admin le corrige (`changer_campus`) | Sinon on change de campus pour gagner le championnat |
| « Mon campus est classé contre les 5 autres, chaque mois » | Score = moyenne des points des membres actifs (comme les classes), saison mensuelle | Un petit campus soudé peut battre un gros ; la saison redonne une raison de revenir |
| « Le tableau me montre d'abord mon campus » | Filtre campus par défaut = le mien, option « Tous les campus » | Une coloc ou un covoit sont locaux ; la compétence (dev, design) peut se faire à distance |
| « Le croisement compte toujours » | Le bonus « croisement » compte maintenant une entraide entre **deux formations** différentes | Le dev qui aide la photographe : l'esprit ESD × ESP, sans les écoles |

## Plan en lots (chacun vérifié avant le suivant)
| Lot | Contenu | Vérification |
|---|---|---|
| 0 | « Moi » menait à Introuvable | Garde-fou Vitest des jointures étendu à `classes` |
| A | Campus à la place d'ESD/ESP | 8 tests SQL (`supabase/tests/0024_campus.sql`), tests Vitest campus et championnat, build |
| B | Ranger la navigation, le profil et les réglages | Parcours à la main sur ordinateur et téléphone |
| C | Formes de post-it par type d'annonce | Aperçu ordinateur et 375 px, test front-portable (jetons seulement) |
| D | Fil social : réactions, commentaires, salons (général, campus, classe), bulle Colette | Tests SQL : on ne lit que les salons où l'on a sa place, une réaction par personne |
| E | Carte autour de chaque campus | Test de projection, punaises cliquables |

## Choix techniques du lot A
- Migration **additive, sans DROP** : l'ancien code en ligne continue de marcher pendant le déploiement (nouvelles fonctions `classement_campus` et `fil_du_campus`, les anciennes restent).
- Les blocs SQL contenant un `DROP` restaient bloqués côté connecteur Supabase (attente de confirmation) : remplacés par `alter policy` et un trigger supplémentaire.
- La colonne `ecole` reste en base (déduite de l'email), invisible à l'écran.
