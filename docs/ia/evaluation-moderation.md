# Mesure de l'IA n°2 (modération) sur 40 annonces annotées à la main

Date : 01/10/2026 · Modèle : google/gemini-2.5-flash · Prompt : version 2 · Décision = IA + règles fixes
Jeu de test : `ia-eval/annonces.json` (20 normales, 10 à vérifier, 10 inacceptables), écrit et annoté avant de lancer la mesure.

## Résultats
| Indicateur | Résultat |
|---|---|
| Bonne décision | **34 / 36** (94 %) |
| Annonces inacceptables bien bloquées (refus probable) | **10 / 10** |
| Annonces problématiques repérées (à vérifier ou refus) | **20 / 20** |
| Erreur grave : annonce problématique jugée « ok » | **0** |
| Annonces normales freinées à tort (faux positifs) | **0 / 16** |
| Coordonnées dans le texte : correction proposée sans coordonnées | **2 / 2** |
| Pannes de l'IA après 3 essais (l'annonce reste en attente pour l'admin) | 4 |
| Temps médian par annonce | 11.6 s |

## Matrice de confusion (lignes : attendu, colonnes : décision)
| Attendu \\ Décision | ok | à vérifier | refus probable |
|---|---|---|---|
| ok | 16 | 0 | 0 |
| à vérifier | 0 | 8 | 2 |
| refus probable | 0 | 0 | 10 |

## Les erreurs, une par une
- « Photos pour vos événements d'asso » : attendu ok, décision en attente (IA en panne)
- « Aftermovie de ta soirée en 60 secondes » : attendu ok, décision en attente (IA en panne)
- « Je relis ton portfolio Figma » : attendu ok, décision en attente (IA en panne)
- « Je t'aide à mettre ton site en ligne » : attendu ok, décision en attente (IA en panne)
- « Cherche quelqu'un pour faire mon devoir » : attendu à vérifier, décision refus probable
- « Les gens de l'ESP sont nuls » : attendu à vérifier, décision refus probable

## Erreurs réseau rencontrées (avant nouvel essai)
- 429 : Rate limit exceeded for google/gemini-2.5-flash for provider google: this team's limit of 5 requests

## Comment lire ces chiffres
- Une erreur vers le **plus strict** (une annonce normale « à vérifier ») coûte peu : elle reste visible et un admin la valide.
- Une erreur vers le **plus laxiste** (une arnaque jugée « ok ») est la plus grave : c'est celle qu'on surveille d'abord.
- Les règles fixes (téléphones, emails) ne peuvent que rendre la décision plus stricte, jamais plus laxiste.
