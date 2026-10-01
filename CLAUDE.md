@AGENTS.md

# Fiche d'identité — L'entraide du campus

> Relis ce fichier avant chaque demande. Si une demande le contredit, demande-moi avant d'agir.

## En 5 lignes
- **Pour qui** : les étudiants du campus (ESD Bordeaux, avec les étudiants de l'ESP).
- **Problème** : on ne sait pas qui, sur le campus, peut nous aider (photo, vidéo, dev, community management…) ni où trouver une coloc ou un covoiturage.
- **Solution** : chacun publie ce qu'il **propose** et ce qu'il **cherche** avec un seul compte. Les coordonnées ne s'échangent qu'après accord.
- **3 écrans** : (1) liste et détail des annonces avec « Demander le contact », (2) demandes reçues avec Accepter / Refuser, puis coordonnées visibles, (3) mon profil généré depuis mon CV, à relire et valider.
- **Ce qu'on ne fait pas** : pas de paiement, pas d'appli mobile native, pas de connexion Google/réseaux sociaux au palier 1, pas de messagerie avant que le palier 1 tourne en ligne.

## Stack (ne pas en ajouter sans me demander)
- **Next.js 16** (App Router, `src/`), TypeScript, Tailwind CSS 4. Gestionnaire : **npm**.
- **Supabase** : Postgres, Auth (email + mot de passe), Storage (CV en PDF). Client : `@supabase/ssr`.
- **Vercel** : déploiement automatique à chaque push sur `main`.
- **GitHub** : `Hadriel33/entraide-campus` (public).
- **IA** : appelée **uniquement côté serveur** (route handler / server action). Clé dans les variables Vercel.
- **Tests** : Vitest pour les règles métier, et tests manuels avec 2 comptes et une fenêtre privée.

## Les 3 règles d'or (vérifiées en base, avec RLS, jamais seulement à l'écran)
1. Mes coordonnées ne sont visibles qu'après mon accord.
2. Je ne peux modifier que mes propres annonces.
3. Une conversation n'est lisible que par ses deux participants.

## Tu ne touches jamais à
- `.env*`, aux clés et secrets. Aucune clé dans le code : variables Vercel uniquement. `service_role` jamais côté client ni dans un fichier commité.
- Aux règles RLS existantes sans me montrer le avant/après.
- Aux fichiers de `docs/` sans me le dire.
- Aux dépendances : pas de nouvelle librairie sans me demander pourquoi.
- Pas de `using (true)` dans une policy RLS.

## Méthode (imposée par le cours)
- Pose-moi tes questions **avant** de coder. Propose un plan en étapes avec, pour chacune, un moyen de vérifier.
- Une demande = une étape. Le test d'abord, puis le code jusqu'à ce que le test passe (sans modifier le test).
- Après chaque étape : explique ce que tu as changé et pourquoi, puis commit et push. Le déploiement Vercel suit tout seul.
- Après 2 essais ratés, on revient à la dernière version qui marchait et on reformule.
- Les prompts des fonctionnalités IA sont rangés dans `src/lib/ai/prompts/` pour être relus et améliorés.
- **Documenter en continu (servira à la présentation)** : après chaque étape, ajouter une ligne dans `docs/JOURNAL.md`. Chaque décision structurante va dans le tableau « Décisions » de `docs/METHODE.md`, chaque problème et son contournement dans « Ce qui n'a pas marché ». On ne réécrit pas l'historique, on ajoute.

## Skills du projet (`.claude/skills/`)
- `nouvelle-etape` : la méthode du cours, à suivre pour chaque nouvelle fonctionnalité.
- `supabase-rls-securite` : RLS, les 3 règles d'or, l'admin, la chasse aux failles.
- `fonctionnalite-ia` : brancher le profil CV et la modération IA proprement.
- `tests-comptes` : Vitest, comptes de test, cas piégés pour l'IA.
- `anti-ia-design` et `ui-ux-pro-max` : design et textes qui ne font pas « généré par IA ».
- `gamification-badges` : badges, avis, historique, sans triche (bonus).

## Liens
- Plan de travail : `docs/PLAN.md`
- Idées et bonus : `docs/IDEES.md`
- Cours : `../COURS VIBE CODING — M2 DATA.pdf`
