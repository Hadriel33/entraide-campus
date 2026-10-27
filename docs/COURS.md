# Le cours en résumé : ce qui est attendu, séance par séance

> Résumé écrit par nous à partir du PDF « COURS VIBE CODING — M2 DATA » (44 pages, reçu le 22/10). Le PDF lui-même n'est pas dans le dépôt : il est public. Hadriel le garde sur son ordinateur.
> État au 22/10/2026 : ✅ fait et vérifié en ligne, 🟡 codé et en ligne mais pas encore vérifié à la main avec 2 comptes, ⬜ à faire.

## Calendrier (le jeudi, 13h-15h)
| Séance | Date | Thème | État |
|---|---|---|---|
| S1 | 1er oct | Lancement, appli en ligne | ✅ |
| S2 | 22 oct | Comptes et annonces | 🟡 |
| S3 | 5 nov | Le palier 1 en entier | 🟡 (en avance) |
| S4 | 19 nov | Les deux IA | 🟡 (en avance) |
| S5 | 26 nov | La chasse aux failles | 🟡 (faite à blanc le 01/10) |
| S6 | 17 déc, 15h15-17h15 | La démo finale | ⬜ |

## S2 · 22 octobre : comptes et annonces
**Au programme** : brancher Supabase, créer les comptes (inscription, connexion, déconnexion), publier une annonce qui reste enregistrée.

**Point d'étape du début de séance**
- ✅ L'appli s'ouvre depuis son adresse, sur téléphone (https://entraide-campus.vercel.app)
- ✅ La fiche d'identité est à la racine (`CLAUDE.md`)
- ✅ Le dernier changement est sur GitHub

**Conseils de la séance**
- ✅ RLS demandée avec chaque table, « RLS enabled » partout, pas de `using (true)`
- ✅ Auth › URL Configuration : l'adresse Vercel à la place de localhost (01/10)
- ✅ Clé publique côté navigateur, clé secrète jamais (variable Vercel serveur uniquement)
- 🟡 Deux comptes de test, un qui propose et un qui cherche : c'est la recette (`docs/RECETTE.md`)

**Trois choix à poser avant la séance 3**
- ✅ La deuxième IA : la modération des annonces (`docs/IDEES.md`, défendue dans `docs/IA-DEFENSE.md`)
- ✅ Le palier visé pour le 17 décembre : le palier 3 (les paliers 2 et 3 sont déjà en ligne)
- ✅ Les trois écrans de la démo : l'annonce et « Demander le contact », la demande acceptée, le profil depuis le CV (`docs/DEMO.md`)

**À faire marcher en ligne avant le 5 novembre**
- 🟡 Je crée un compte, je me déconnecte, je me reconnecte : il existe toujours (bloc 1 de la recette)
- 🟡 Je publie une annonce et je la retrouve après avoir rechargé (bloc 3 de la recette)
- ✅ La deuxième IA est choisie et écrite noir sur blanc

## S3 · 5 novembre : le palier 1 en entier
Demande de contact, acceptation, coordonnées visibles ; les 3 règles d'or tiennent ; testé sur téléphone et par quelqu'un d'autre.
**Avant le 19 novembre** : 🟡 le contact accepté affiche les coordonnées · 🟡 les règles d'or tiennent quand on essaie de les casser · ⬜ testé depuis un deuxième compte (recette blocs 4 et 5).

## S4 · 19 novembre : les deux IA
Livrable : le profil depuis le CV tourne en ligne, la deuxième IA existe, aucune clé d'API dans le code.
Ce qu'un client vérifie : un besoin clair, un humain qui valide, un plan si ça rate, aucune clé visible (sinon 5 points en moins).
État : 🟡 les deux IA sont en ligne (plus une IA n°3 bonus). La clé serveur a été ajoutée sur Vercel le 22/10 : reste à vérifier avec Admin › Impact › « Tester maintenant ».

## S5 · 26 novembre : la chasse aux failles
1re heure : attaquer l'appli d'un voisin (coordonnées sans accord, annonce d'un autre, conversation). 2e heure : réparer, puis trois semaines pour finir.
État : 🟡 chasse faite à blanc (`docs/securite/`), à rejouer pour de vrai le 26/11.

## S6 · 17 décembre : la démo finale
3 minutes en direct sur l'appli en ligne (pas de capture ni de vidéo), puis expliquer ses choix : le palier, les deux IA, ce qu'on ferait avec une séance de plus.
Livrable : l'adresse en ligne, le palier 1 complet (+ 2 et 3), les deux IA, le lien GitHub sans clé, la démo.
Conseils : annonces crédibles, deux comptes ouverts à l'avance, répéter 3 fois chronométré depuis un autre ordinateur, ne plus toucher au code la veille, partage de connexion prêt.

## Notation
| Critère | Poids | Où on en est |
|---|---|---|
| En ligne dès la séance 1 | 10 % | ✅ en ligne le 01/10 |
| Méthode (découper, cadrer l'IA, tester, réparer) | 30 % | `docs/JOURNAL.md`, `docs/METHODE.md`, `docs/etapes/`, tests Vitest et SQL, CI |
| Parcours fonctionnel (palier 1 en ligne) | 20 % | 🟡 en ligne, recette à 2 comptes à faire |
| Sécurité (règles d'or pendant la chasse) | 15 % | 🟡 tests SQL, à confirmer le 26/11 |
| IA (conception 15 %, implémentation 10 %) | 25 % | 🟡 `docs/IA-DEFENSE.md`, mesures dans `docs/ia/` |

Si la démo ne tourne pas en ligne, le projet n'est pas noté. Une clé visible coûte 5 points.
Trophées : le Livreur, l'Architecte (méthode), le Gardien (sécurité), l'Inventeur (IA).
