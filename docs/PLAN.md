# Plan de travail

Appli en ligne : **https://entraide-campus.vercel.app**

🟡 = codé, en ligne et testé en base ; reste le test à la main avec 2 comptes.

Chaque étape a un moyen de vérification. On ne passe à la suivante que quand la vérification est verte **en ligne**.

| # | Séance | Étape | Comment on vérifie |
|---|---|---|---|
| 1 ✅ | S1 · 1er oct | Page vide en ligne (GitHub → Vercel), fiche d'identité à la racine | L'adresse Vercel s'ouvre sur mon téléphone. Un commit poussé apparaît en ligne en moins de 2 min. |
| 2 ✅ | S1 · 1er oct | Projet Supabase créé (vide), variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` dans Vercel | `vercel env ls` les liste. Le build passe. |
| 3 🟡 | S2 · 22 oct | Comptes : inscription, connexion, déconnexion (Supabase Auth). URL Vercel dans Auth › URL Configuration. | Je crée un compte, je me déconnecte, je me reconnecte : il existe toujours. |
| 4 🟡 | S2 · 22 oct | Table `annonces` + RLS (lecture : connectés ; écriture : auteur seulement) | Je publie, je recharge, l'annonce est là. Le 2e compte ne peut pas la modifier (test SQL + test à la main). |
| 5 🟡 | S3 · 5 nov | Demande de contact → accepter / refuser → coordonnées visibles (table `profils_prives` protégée par RLS) | Avec 2 comptes en fenêtre privée : coordonnées invisibles avant accord, y compris dans l'onglet Réseau. |
| 6 🟡 | S4 · 19 nov | IA n°1 : CV PDF → compétences en JSON → écran de relecture → profil validé | 3 CV de test (normal, presque vide, texte caché). Si l'IA échoue, la saisie manuelle reste possible. |
| 7 🟡 | S4 · 19 nov | IA n°2 : modération des annonces (voir `IDEES.md`) + espace admin | Une annonce douteuse est signalée et l'admin la supprime. Rien n'est supprimé sans validation humaine. |
| 8 🟡 | S5 · 26 nov (à blanc le 01/10) | Chasse aux failles : corriger côté base + un test par faille | Je refais l'attaque après correction, elle échoue. |
| 9 🟡 | Bonus | Palier 2 (messagerie en direct) et palier 3 (suggestions « Pour toi ») | 6 tests SQL (règle d'or n°3), 6 tests de matching. À la main : discuter entre 2 comptes. |
| 10 🟡 | Ajout 01/10 | Profil (pseudo, photo, bio), rôle admin et modération, gamification (points, niveaux, badges, avis, classement) | 14 tests SQL de sécurité. À la main : nommer un admin, masquer une annonce, laisser un avis. |
| 11 🟡 | Ajouts 01/10 | Post-it campus : DA « mur du campus », Colette, bureau, classes, carte, fil du campus, tableau noir | 108 tests Vitest, 84 vérifications SQL. À la main : `docs/RECETTE.md`. |
| 12 🟡 | Ajout 01/10 | IA n°2 v2 : correction proposée à l'auteur | 6 tests de règles, 4 tests SQL, 4 annonces piégées testées en réel (`docs/ia/`). |
| 13 | S6 · 17 déc | Démo finale de 3 minutes | `docs/DEMO.md` répétée 3 fois ; `docs/IA-DEFENSE.md` et `docs/securite/FAILLES.md` pour les questions. |

