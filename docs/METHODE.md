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
| 01/10 | Gamification repoussée après le palier 1 | Anti-guide du cours : ne pas viser le palier 3 sur une appli sans comptes. |

## 6. Ce qui n'a pas marché (et comment on l'a contourné)
| Date | Problème | Solution |
|---|---|---|
| 01/10 | Le connecteur Vercel de Claude n'a pas le droit de créer un projet (erreur 403) | Import fait depuis le dashboard Vercel. |
| 01/10 | La copie locale de padel-snipe n'était pas à jour (22 commits de retard) | Lecture directe de la version GitHub (`origin/main`), sans toucher à la branche locale. |
