# Skills du projet

Chaque skill = des **consignes** (`SKILL.md`) + des **modèles de code** (`modeles/`) tirés du vrai code du projet.
On les appelle dans Claude Code avec `/nom-du-skill`.

| Skill | Quand | Modèles |
|---|---|---|
| `nouvelle-etape` | Au début de chaque fonctionnalité | fiche d'étape, Server Action |
| `supabase-rls-securite` | Table, policy, action serveur, chasse aux failles | migration + RLS, test RLS SQL, client serveur, proxy |
| `tests-comptes` | Test avant le code, comptes de test, cas piégés IA | test de règle métier |
| `fonctionnalite-ia` | Les 2 IA (profil CV, modération) | (ajoutés à l'étape 6) |
| `adapter-front` | Changer de DA, migrer vers une référence visuelle | thème (jetons), composant |
| `anti-ia-design` | Avant toute page ou texte visible | |
| `ui-ux-pro-max` | Chercher palettes, polices, styles | base de données + scripts |
| `gamification-badges` | Badges, avis, historique (bonus) | |

## Réutiliser ces skills dans un autre projet
Ils sont génériques (Next.js + Supabase + Vercel) : copier `.claude/skills/` dans le nouveau projet, puis
1. adapter les noms de tables dans les modèles SQL ;
2. appliquer une nouvelle référence visuelle avec `adapter-front` (seul `globals.css` change) ;
3. garder les tests `front-portable` et `test-rls`, qui valent pour tout projet.
