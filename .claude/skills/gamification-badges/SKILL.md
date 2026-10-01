---
name: gamification-badges
description: Conception des badges, titres, points, avis/notes et historique utilisateur sans triche possible. À utiliser quand on touche à la gamification, aux avis « à la Google » ou au profil public (historique des entraides).
---

# Gamification sans triche

Adapté du programme de récompenses de padel-snipe (registre `reward_grants`) et de sa faille de sécurité du 15/09 (des points et badges modifiables par l'utilisateur).

## Prérequis
Le palier 1 tourne en ligne et les 3 règles d'or tiennent. Sinon, on ne commence pas (anti-guide du cours : « viser le palier 3 tout de suite »).

## Modèle de données
- `badges` (catalogue) : `code`, `nom`, `description`, `condition` (texte lisible).
- `badges_obtenus` (registre) : `user_id`, `badge_code`, `source`, `cle_unique`, `obtenu_le`, avec une **contrainte unique** sur `(user_id, cle_unique)`. Exemple de clé : `entraides:10`. Le même badge ne peut jamais être attribué deux fois.
- `avis` : `mise_en_relation_id`, `auteur_id`, `cible_id`, `note` (1 à 5, `check`), `commentaire`, avec une contrainte unique sur `(mise_en_relation_id, auteur_id)`.
- Les compteurs et la note moyenne sont des **vues** ou sont calculés par trigger. Ce ne sont jamais des colonnes que l'utilisateur peut écrire.

## Règles anti-triche
- On récompense une **mise en relation acceptée**, pas une demande envoyée. Sinon, on peut farmer en spammant des demandes.
- Les badges sont attribués **par la base** : trigger sur le passage d'une demande à `acceptee`, ou fonction `security definer`. L'utilisateur n'a ni `insert` ni `update` sur `badges_obtenus`.
- Un avis n'est possible que si la mise en relation existe, est acceptée et implique l'auteur. On ne peut pas s'auto-noter (`auteur_id <> cible_id`).
- Tester chaque règle avec 2 comptes (voir `supabase-rls-securite`), y compris par un appel direct à l'API REST Supabase avec la clé publishable.

## Idées de badges (à valider)
- « Premier coup de main » : 1re mise en relation acceptée en tant que personne qui propose.
- « Pilier du campus » : 10 entraides conclues.
- « Polyvalent » : des annonces dans 3 catégories différentes.
- Titres par catégorie : « Photographe du campus » (5 entraides en photo).

## Écrans
- Profil public : badges, nombre d'entraides, note moyenne et nombre d'avis, historique des annonces passées.
- Une barre de progression vers le prochain badge (« encore 2 entraides avant Pilier du campus »).
- Admin : voir et masquer un avis signalé (via la modération IA).
