# L'entraide du campus

**En ligne : https://entraide-campus.vercel.app**

Appli où les étudiants de l'ESD et de l'ESP Bordeaux proposent ce qu'ils savent faire et trouvent ce dont ils ont besoin.
Projet du module **Vibe Coding (M2 Data)**, ESD Bordeaux, oct.–déc. 2026. Projet étudiant non officiel.

## Fonctionnalités
- **Palier 1** : comptes (pseudo, photo, bio), annonces (je propose / je cherche, 13 catégories), demande de contact, acceptation, coordonnées visibles seulement après accord.
- **Palier 2** : conversation en direct entre les deux personnes, après acceptation.
- **Palier 3** : suggestions « Pour toi », expliquées (catégories et compétences).
- **IA n°1** : compétences extraites du CV (PDF), relues et validées par l'étudiant. Le CV n'est jamais stocké.
- **IA n°2** : modération des annonces, file de l'admin, l'humain décide.
- **Gamification** : points, niveaux, 7 badges, avis de 1 à 5 étoiles, classement ESD contre ESP.
- **Admin** : statistiques, modération, signalements, rôles.
- **Vie de l'appli** : notifications en direct, accueil guidé, recherche, filtres par quartier et ligne de tram, annonces qui expirent avec relance, favoris, défi de la semaine, titres de spécialité, classement de la semaine, compteur d'impact.
- **Réservé aux étudiants** : emails @mail-esd.com et @mail-esp.com, école déduite automatiquement.

## Sécurité
Les 3 règles d'or sont garanties **en base** (RLS et triggers) et testées par des scripts SQL (`supabase/tests/`) : plus de 50 attaques et vérifications automatisées, toutes bloquées. Rapport : [docs/securite/chasse-aux-failles-a-blanc.md](docs/securite/chasse-aux-failles-a-blanc.md).

## Stack
Next.js 16 · Supabase (Postgres, Auth, Storage, Realtime) · Vercel (+ AI Gateway, Gemini 2.5 Flash) · Tailwind 4 · Vitest · GitHub Actions.

## Documentation de la méthode
- Fiche d'identité : [CLAUDE.md](CLAUDE.md) · Plan : [docs/PLAN.md](docs/PLAN.md) · Méthode et décisions : [docs/METHODE.md](docs/METHODE.md) · Journal : [docs/JOURNAL.md](docs/JOURNAL.md)
- Fiches d'étape : [docs/etapes/](docs/etapes/) · Direction artistique : [docs/DA.md](docs/DA.md) · Skills : [.claude/skills/](.claude/skills/)

```bash
npm install
npx vercel env pull .env.local   # variables publiques + jeton OIDC pour l'IA
npm run dev
npm test
```
