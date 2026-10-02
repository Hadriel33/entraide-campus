# Post-it campus

**En ligne : https://entraide-campus.vercel.app**

Le tableau d'entraide des étudiants de l'ESD et de l'ESP Bordeaux : chacun affiche ce qu'il sait faire et ce qu'il cherche, en post-it. Un shooting, un coup de main sur ton code, une coloc, un covoit. Les coordonnées ne s'échangent qu'après accord.

Projet du module **Vibe Coding (M2 Data)**, ESD Bordeaux, octobre à décembre 2026. Projet étudiant non officiel.

## Le parcours (palier 1 du brief)
Sam est photographe (ESP), Léa organise le gala de son asso (ESD).
1. Sam crée son compte avec son mail d'école et dépose son CV : **l'IA propose ses compétences**, il les valide.
2. Sam publie « Photos pour vos événements d'asso ».
3. Léa trouve l'annonce et **demande le contact**.
4. Sam **accepte** : les coordonnées apparaissent des deux côtés, et une **discussion en direct** s'ouvre.

## Les 3 paliers
- **Palier 1, ça tourne** : comptes réservés à @mail-esd.com et @mail-esp.com, annonces, demande de contact, coordonnées visibles seulement après accord.
- **Palier 2, ça discute** : discussion en direct entre les deux personnes, après acceptation.
- **Palier 3, ça matche** : suggestions « Pour toi » expliquées (compétences et catégories).

## Les 3 IA (avec Colette, la mascotte)
- **IA n°1, le profil depuis le CV** : le PDF est lu par l'IA puis oublié (jamais stocké), l'étudiant garde ou retire chaque compétence.
- **IA n°2, la relecture des annonces** (inventée) : ok, à vérifier ou refus probable. Quand c'est réparable (numéro collé dans le texte, ton agressif), **Colette propose une version corrigée** que l'auteur applique ou non. Un admin garde le dernier mot.
- **Mesurée** sur 40 annonces annotées à la main (`npm run eval:ia`) : 94 % de bonnes décisions, 10 arnaques sur 10 bloquées, aucune annonce normale freinée. Rapport : [docs/ia/evaluation-moderation.md](docs/ia/evaluation-moderation.md).
- **IA n°3, le « Pour moi » intelligent** (inventée) : Colette classe le tableau d'après tes compétences en comprenant le sens (« Power BI » colle à « tableau de bord »). Mesurée : 97 % contre 73 % pour les règles. Rapport : [docs/ia/evaluation-matching.md](docs/ia/evaluation-matching.md).
- **Bonus, Colette rédactrice** : une phrase, et elle remplit l'annonce ; l'étudiant relit avant de publier.
- Aucune clé d'API : Vercel AI Gateway (jeton OIDC), modèle Gemini 2.5 Flash. Défense complète : [docs/IA-DEFENSE.md](docs/IA-DEFENSE.md).

## La sécurité
Les 3 règles d'or (coordonnées après accord, mes annonces seulement, conversation à deux) sont garanties **en base** : RLS, triggers, droits par colonne. **87 vérifications SQL** rejouables dans `supabase/tests/`, toutes bloquées. Failles trouvées, corrigées et testées : [docs/securite/FAILLES.md](docs/securite/FAILLES.md).

## Et pour donner envie de revenir
Mon bureau (ce qui t'attend, punaisé), le tableau d'impact de l'admin (entonnoir, croisement ESD × ESP, offre et demande), l'appli installable sur le téléphone, le tableau en direct à projeter, la vraie carte de Bordeaux par quartier, le classement des étudiants, des classes et ESD contre ESP, les badges, le défi de la semaine, la garde-robe de Colette à débloquer, le fil du campus (avec l'accord des deux), le mode tableau noir, les notifications en direct.

## Stack
Next.js 16 · Supabase (Postgres, Auth, Storage, Realtime, pg_cron) · Vercel (+ AI Gateway) · Tailwind CSS 4 · Vitest · GitHub Actions. Aucune librairie d'interface ni de carte : tout est dans `src/`.

## La méthode (documentée en continu)
- Fiche d'identité relue à chaque demande : [CLAUDE.md](CLAUDE.md)
- Plan en étapes vérifiables : [docs/PLAN.md](docs/PLAN.md) · Décisions et ce qui n'a pas marché : [docs/METHODE.md](docs/METHODE.md) · Journal : [docs/JOURNAL.md](docs/JOURNAL.md)
- Direction artistique (6 versions, maquettes avant le code) : [docs/DA.md](docs/DA.md) · Skills du projet : [.claude/skills/](.claude/skills/)
- Recette à deux comptes : [docs/RECETTE.md](docs/RECETTE.md) · Démo de 3 minutes : [docs/DEMO.md](docs/DEMO.md)

## En chiffres
22 migrations SQL · 87 vérifications de sécurité en base · une simulation de campus (25 contrôles) · 112 tests Vitest · CI à chaque push (lint, tests, build, typage, recherche de clés) · parcours Playwright après chaque déploiement (public, téléphone, étudiant connecté).

## Lancer en local
```bash
npm install
npx vercel env pull .env.local   # variables publiques + jeton OIDC pour l'IA (aucune clé dans le code)
npm run dev
npm test
npm run e2e                       # parcours dans un vrai navigateur sur l'appli en ligne (Playwright)
```
