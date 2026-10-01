# Journal

| Date | Ce qui marche en ligne | Problème rencontré |
|---|---|---|
| 01/10/2026 | Dépôt GitHub, fiche d'identité, plan, skills du projet | Création du projet Vercel impossible via le connecteur (403) : import à faire depuis vercel.com |
| 01/10/2026 | Projet Supabase créé (org gratuite séparée, région eu-west-1), vide. `.env.local` (non commité) et `.env.example` (commité, sans valeurs) | Organisation créée à la main par Hadriel : le connecteur ne sait pas créer d'organisation |
| 01/10/2026 | Projet Vercel `entraide-campus` créé en ligne de commande et branché sur GitHub, 2 variables Supabase (type Config) sur Production, Preview et Development. Ancien projet `m1-data` supprimé (vérifié : 404) | Variables `NEXT_PUBLIC_` refusées en type « Secret » dans l'interface : ce sont des valeurs publiques, il faut le type Config |
| 01/10/2026 | **Appli en ligne : https://entraide-campus.vercel.app** (HTTP 200). Le push GitHub déclenche bien le déploiement automatique (statut « Vercel success » sur le commit). Étapes 1 et 2 du plan validées | Les URL de prévisualisation sont protégées par Vercel (302) : normal, seule l'adresse de production est publique |
| 01/10/2026 | Étape 3 (comptes) en ligne : inscription, connexion, déconnexion, `/compte` protégée (307 vers /connexion). Table `profils` + RLS, 3 tests SQL OK, advisors Supabase sans alerte. 11 tests Vitest OK | Next.js 16 : `middleware` renommé `proxy`. Tailwind 4 : nouvelle syntaxe des couleurs → jetons `@theme`. Conflit npm vitest/@types/node → @types/node 24 |
| 01/10/2026 | Skills enrichis de modèles de code + skill `adapter-front`, front piloté par jetons, `docs/DA.md` (3 pistes + recherche) | En attente : choix de la DA, réglages Auth dans le dashboard Supabase |
