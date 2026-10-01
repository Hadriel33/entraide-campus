---
name: supabase-rls-securite
description: Règles de sécurité Supabase de l'appli : RLS, les 3 règles d'or, rôle admin, clés. À utiliser dès qu'on crée ou modifie une table, une policy, une server action ou une route API, et pour préparer ou rejouer la chasse aux failles.
---

# Sécurité Supabase : RLS et règles d'or

Tiré de l'audit de sécurité de padel-snipe (15/09/2026) et adapté au brief du cours.

## Les 3 règles d'or (testées en direct en séance 5)
1. **Mes coordonnées ne sont visibles qu'après mon accord.** Elles vivent dans une table séparée (`coordonnees`), lisible seulement par le propriétaire **ou** par quelqu'un qui a une `demande_contact` au statut `acceptee` avec lui. Elles ne sont jamais jointes dans la réponse de la liste des annonces : vérifier dans l'onglet Réseau.
2. **Je ne peux modifier que mes propres annonces.** Policies `update` et `delete` avec `auteur_id = auth.uid()` dans `using` **et** dans `with check`.
3. **Une conversation n'est lisible que par ses deux participants.** Policy `select` sur `messages` avec `auth.uid() in (participant_a, participant_b)`.

## Règles à appliquer à chaque migration
- `alter table ... enable row level security;` dans **la même migration** que le `create table`. Ensuite, vérifier « RLS enabled » dans le dashboard ou avec l'outil `get_advisors`.
- **Jamais** `using (true)` (sauf pour une donnée vraiment publique, et en le justifiant dans un commentaire).
- Une policy par opération (`select`, `insert`, `update`, `delete`). Pas de `for all` paresseux : chez padel-snipe, `users: own row` en `FOR ALL` laissait un utilisateur s'écrire `plan`, `badges` et `points` par un simple PATCH.
- Les colonnes sensibles (`role`, `badges`, `points`, `note_moyenne`, `statut_moderation`) ne sont **pas** modifiables par l'utilisateur. Les mettre dans une table à part écrite par trigger ou fonction `security definer`, ou révoquer la colonne : `revoke update (role) on profils from authenticated;`.
- Les migrations vivent dans `supabase/migrations/`, numérotées. On ne modifie jamais une migration déjà appliquée : on en écrit une nouvelle.

## Côté code Next.js
- L'identité vient **toujours** de `supabase.auth.getUser()` côté serveur, jamais d'un `userId` reçu dans le corps de la requête ou l'URL (faille IDOR vécue chez padel-snipe).
- La clé `service_role` ne sert qu'en serveur, jamais dans un fichier `'use client'`, jamais avec le préfixe `NEXT_PUBLIC_`. La clé publishable (anon) peut être publique, c'est la RLS qui protège.
- Toute action admin vérifie le rôle **en base** (`profils.role = 'admin'` lu via RLS ou une fonction `est_admin()`), pas un booléen envoyé par le client.
- Redirections : uniquement vers des chemins internes (`/...`), jamais une URL reçue en paramètre (open redirect).
- Auth › URL Configuration : Site URL = l'adresse Vercel, pas localhost.

## Tester une règle (test d'abord)
Pour chaque règle, écrire un test qui se connecte avec **2 comptes de test** et prouve :
- que le compte B ne lit pas les coordonnées de A avant l'acceptation, puis qu'il les lit après ;
- que B ne peut pas faire `update` sur l'annonce de A (0 ligne modifiée ou erreur) ;
- que C ne lit pas la conversation A–B.

## Checklist chasse aux failles (séance 5)
- 2 comptes + une fenêtre privée. Changer l'identifiant dans l'URL (`/annonces/12` → `/13`).
- Onglet Réseau : des coordonnées passent-elles sans être affichées ?
- Chercher des clés dans le code GitHub et dans le JS du site (`sb_secret`, `service_role`, `sk-`).
- Pour chaque faille : ce que j'ai fait, ce que j'ai vu, pourquoi c'est grave. Corriger **côté base**, écrire le test, puis rejouer l'attaque.

## Modèles de code (tirés du projet, à copier)
- [modeles/migration-table.sql](modeles/migration-table.sql) : une table et ses 4 policies dans la même migration.
- [modeles/test-rls.sql](modeles/test-rls.sql) : tester une règle avec 2 comptes fictifs dans une transaction annulée.
- [modeles/client-serveur.ts](modeles/client-serveur.ts) : client Supabase serveur et `getUtilisateur()`.
- [modeles/proxy-session.ts](modeles/proxy-session.ts) : rafraîchissement de session et pages protégées (Next.js 16).
