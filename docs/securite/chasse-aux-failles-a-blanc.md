# Chasse aux failles « à blanc » (01/10/2026)

Objectif : jouer l'attaquant sur notre propre appli **avant** la séance 5, avec les méthodes du cours (2 comptes, URL modifiées, onglet Réseau, recherche de clés), puis corriger côté base et rejouer l'attaque.

## 1. Sans compte, avec la clé publique visible dans le navigateur
| Attaque | Avant | Après correctif |
|---|---|---|
| Lire profils, coordonnées, annonces, demandes, avis, signalements via l'API REST | Vide (RLS) | Vide |
| Appeler les fonctions internes (stats, admin, rôle) | Refusé | Refusé |
| Publier une annonce | Refusé, mais l'erreur dévoilait le nom de la fonction `est_admin` | **Refusé, message neutre** (migration 0009 : plus aucun droit d'écriture pour les visiteurs) |
| Créer une demande de contact | Refusé, mais l'erreur permettait de **deviner si une annonce existe** (oracle) | **Refusé, message neutre** (connexion exigée avant toute vérification) |
| Envoyer une photo dans le dossier d'un autre | Refusé (policy Storage) | Refusé |
| Lister les photos du bucket | Vide | Vide |
| S'inscrire avec `"role": "admin"` dans les métadonnées | Sans effet : le trigger ne lit que prénom, école et pseudo, et le rôle n'est pas modifiable | Idem |

## 2. Avec deux comptes (tests SQL rejouables dans `supabase/tests/`)
22 attaques automatisées, toutes bloquées : voir les coordonnées sans accord, détourner une demande, accepter sa propre demande, changer une réponse, modifier ou supprimer l'annonce d'un autre, publier au nom d'un autre, voir une annonce archivée d'un autre, se nommer admin (deux façons), masquer ou démasquer sans être admin, faux avis, avis détourné, auto-valider sa modération (deux façons), contourner la modération en modifiant le texte, et d'autres.

## 3. Ce que voit le navigateur
- **Clés dans le JavaScript public** (600 Ko analysés) : aucune clé secrète. Seule la clé publique est présente, et elle est faite pour ça.
- **Onglet Réseau** : les coordonnées ne sont demandées au serveur qu'**après** une acceptation. Avant, la page ne les charge même pas, et la base refuserait de toute façon (RLS).
- **Identifiants dans les URL** : des UUID, donc on ne peut pas passer de `/annonces/12` à `/13`. Une annonce qui n'est pas visible répond « introuvable », exactement comme une annonce qui n'existe pas.
- **En-têtes de sécurité** : seul HSTS était présent. Ajout de `frame-ancestors 'none'` et `X-Frame-Options` (anti-clickjacking), de `nosniff`, de `Referrer-Policy` et de `Permissions-Policy` (`next.config.ts`).

## 4. Garde-fous permanents
- **CI GitHub** (`.github/workflows/ci.yml`) : lint, 60 tests, build, typage et **recherche de clés secrètes dans le code** à chaque push.
- Test `front-portable` : pas d'emoji, de couleur en dur ni de pictogramme.

## 5. Réglages du dashboard (faits le 01/10 par Claude dans le navigateur, Hadriel s'étant connecté lui-même)
- **Mot de passe minimum = 8** dans Supabase Auth. Vérifié : un appel direct à l'API avec 7 caractères renvoie maintenant `weak_password`.
- Confirmation d'email désactivée (le SMTP gratuit n'envoie qu'à l'équipe), URL de redirection `https://entraide-campus.vercel.app/**` ajoutée.
- Réactiver la confirmation d'email une fois l'envoi d'emails branché sur Brevo.
