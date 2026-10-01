# Journal

| Date | Ce qui marche en ligne | Problème rencontré |
|---|---|---|
| 01/10/2026 | Dépôt GitHub, fiche d'identité, plan, skills du projet | Création du projet Vercel impossible via le connecteur (403) : import à faire depuis vercel.com |
| 01/10/2026 | Projet Supabase créé (org gratuite séparée, région eu-west-1), vide. `.env.local` (non commité) et `.env.example` (commité, sans valeurs) | Organisation créée à la main par Hadriel : le connecteur ne sait pas créer d'organisation |
| 01/10/2026 | Projet Vercel `entraide-campus` créé en ligne de commande et branché sur GitHub, 2 variables Supabase (type Config) sur Production, Preview et Development. Ancien projet `m1-data` supprimé (vérifié : 404) | Variables `NEXT_PUBLIC_` refusées en type « Secret » dans l'interface : ce sont des valeurs publiques, il faut le type Config |
