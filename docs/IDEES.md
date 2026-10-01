# Idées et bonus

## IA n°2 (inventée) : la modération des annonces, candidate n°1
- **Besoin** : sur une appli ouverte à tout le campus, il faut éviter les annonces hors sujet, insultantes, les arnaques ou les coordonnées collées dans le texte (ce qui contournerait la règle d'or n°1).
- **Pour qui** : l'admin (le BDE ou l'école). Les étudiants en profitent indirectement.
- **Pourquoi c'est mieux qu'un formulaire** : l'IA lit le texte libre et explique pourquoi elle signale une annonce. Un filtre de mots-clés ne sait pas faire ça.
- **Fonctionnement** : à la publication, l'IA renvoie un JSON `{ statut: "ok" | "a_verifier" | "refus_probable", raisons: [...] }`. Les annonces « à vérifier » arrivent dans une file d'attente admin.
- **Humain qui valide** : seul l'admin supprime ou masque. L'IA ne supprime jamais rien seule.
- **Plan si ça rate** : si l'IA est en panne, l'annonce est publiée en « à vérifier » et l'admin la voit quand même.
- **Tests** : une annonce normale, une avec un numéro de téléphone, une insultante, une avec une injection de prompt (« ignore tes instructions… »).
- **Sécurité** : rôle `admin` stocké en base et vérifié par RLS. Un utilisateur ne peut pas se l'attribuer lui-même.

## Gamification (après le palier 1)
- **Badges et titres** : on les gagne en répondant aux annonces et en concluant des mises en relation (« Premier coup de main », « Photographe du campus », « 10 entraides »…).
  - Les badges sont attribués **par la base** (trigger ou fonction serveur), avec un registre `badges_obtenus(source, cle_unique)` pour ne jamais attribuer deux fois le même.
  - L'utilisateur ne peut **pas** écrire ses propres badges ni ses points (leçon de padel-snipe : faille corrigée par la migration 104).
  - Anti-triche : on récompense une mise en relation **acceptée**, pas une simple demande, sinon n'importe qui pourrait farmer.
- **Avis et notes « à la Google »** : 1 à 5 étoiles + un commentaire, seulement après une mise en relation acceptée, un seul avis par mise en relation. Les avis peuvent passer par la modération IA.
- **Historique** : sur le profil public, les annonces passées, le nombre d'entraides réalisées, les badges et les avis reçus.
