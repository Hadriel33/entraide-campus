# Étape 4 : les annonces

## La demande en une phrase vérifiable
« Je publie une annonce (je propose ou je cherche), je recharge la page et elle est toujours là. Un autre étudiant la voit mais ne peut ni la modifier ni la supprimer. »

## Questions posées avant de coder, et réponses retenues
| Question | Réponse retenue | Pourquoi |
|---|---|---|
| Quels champs ? | Type (je propose / je cherche), catégorie, titre, description, contrepartie, lieu (facultatif) | Les champs vus dans la recherche (DA.md) et les maquettes. La contrepartie affichée fait partie de la différenciation. |
| Quelles catégories ? | Les 13 de la recherche : photo, vidéo, design, UX/UI, dev web, data et IA, rédaction et CM, coloc, covoiturage, prêt de matériel, binôme de projet, shooting, coup de main | Ce sont les compétences réelles des deux écoles et les besoins des étudiants bordelais. |
| Qui voit quoi ? | Les connectés voient les annonces publiées. L'auteur voit aussi ses annonces archivées. Les visiteurs ne voient rien | Une appli réservée au campus. |
| Qui modifie ? | L'auteur seulement : modifier, archiver, supprimer | Règle d'or n°2, garantie par la RLS en base et pas seulement par l'interface. |
| Identifiant dans l'URL ? | Un UUID, pas un numéro | On ne peut pas parcourir les annonces en changeant `/12` en `/13` (piste de la chasse aux failles). |
| Coordonnées dans l'annonce ? | Non | Elles arrivent à l'étape 5, dans une table protégée. La modération IA (étape 7) repérera les numéros collés dans le texte. |

## Plan (chaque sous-étape a sa vérification)
1. **Test d'abord** : `validerAnnonce` (type, catégorie, longueurs, contrepartie). → échec, puis succès.
2. **Base** : migration `annonces` + 4 policies + droits par colonne. → advisors sans alerte, et tests SQL : B ne modifie ni ne supprime l'annonce de A, B ne publie pas au nom de A, l'archive de A est invisible pour B, un anonyme ne voit rien.
3. **Code** : `/annonces` (liste et filtres), `/annonces/nouvelle`, `/annonces/[id]` (détail), `/annonces/[id]/modifier`, `/mes-annonces`. → build OK.
4. **En ligne** : avec 2 comptes, publier, recharger, essayer de modifier depuis l'autre compte.
