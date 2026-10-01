---
name: nouvelle-etape
description: Méthode du module Vibe Coding pour avancer d'une étape. À utiliser au début de toute nouvelle fonctionnalité ou demande de changement sur l'appli (« on fait les comptes », « ajoute les annonces », « étape suivante »). Cadre, découpe, teste, pousse et vérifie en ligne.
---

# Avancer d'une étape (méthode du cours)

La méthode compte pour 30 % de la note. Suis ces étapes dans l'ordre, sans en sauter.

## 1. Cadrer (avant tout code)
1. Relis `CLAUDE.md` (fiche d'identité) et `docs/PLAN.md`. Repère l'étape en cours.
2. Reformule la demande en **une** phrase vérifiable. Interdit : « joli », « rapide », « propre ». Exemple vérifiable : « le formulaire refuse une adresse sans arobase ».
3. **Pose tes questions avant de coder** : données concernées, qui a le droit de lire et d'écrire, cas limites.
4. Propose un mini-plan de 2 à 5 sous-étapes. Pour chacune, donne **le moyen de vérifier**. Attends le « vas-y ».

## 2. Construire par petits pas
- Une sous-étape à la fois. Si la demande fait plus de 3 phrases, découpe-la.
- **Test d'abord** pour toute règle métier ou de sécurité : écris le test (Vitest ou SQL) **sans** coder la fonction, montre-le échouer, puis code jusqu'à ce qu'il passe **sans modifier le test**.
- Toute table créée s'accompagne de sa RLS dans la même migration (voir le skill `supabase-rls-securite`).
- Aucune nouvelle dépendance sans justification. Aucune clé dans le code.

## 3. Vérifier
1. `npm run build` puis `npm test` (s'il y a des tests). Montre le résultat.
2. Explique en 3 à 5 lignes **ce que tu as changé et pourquoi**.
3. Donne le protocole de test à la main : téléphone, 2e compte en fenêtre privée, une saisie bizarre.

## 4. Sauvegarder et mettre en ligne
1. Commit avec un message en français qui dit ce qui marche (`feat: publication d'une annonce`).
2. `git push`. Vercel redéploie tout seul.
3. Vérifie que le déploiement est en état READY et que la fonctionnalité marche **sur l'adresse en ligne**. « Ce qui n'est pas en ligne n'existe pas. »
4. Coche l'étape dans `docs/PLAN.md` et ajoute une ligne au `docs/JOURNAL.md` (date, ce qui marche, problème rencontré).

## Si ça coince
- Après 2 corrections ratées : reviens à la dernière version qui marchait (`git restore` / `git revert`) et reformule la demande.
- Pour un bug, demande : ce que j'ai fait, ce que j'attendais, ce qui s'est passé, et l'erreur complète de la console.
- Bloqué plus de 20 minutes : rédige un message court pour le mur des blocages.

## Modèles
- [modeles/fiche-etape-exemple.md](modeles/fiche-etape-exemple.md) : la fiche d'une étape (demande vérifiable, questions et réponses, plan, choix techniques). À recopier dans `docs/etapes/NN-nom.md` au début de chaque étape.
- [modeles/server-action.ts](modeles/server-action.ts) : valider, vérifier l'identité côté serveur, écrire sous RLS.
