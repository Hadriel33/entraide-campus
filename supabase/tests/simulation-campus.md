# Simulation d'un campus (01/10/2026) : 25 contrôles sur 25

Faute de copie locale de Supabase (pas de Docker sur le poste), le parcours complet est simulé **dans la base, dans une transaction annulée** :
rien n'est conservé, aucun compte n'est créé en production. Les « actions » se font sous l'identité de chaque étudiant
(`set local role authenticated` + `request.jwt.claims`), exactement comme l'appli : les règles RLS et les triggers s'appliquent.

## Le scénario
- 12 étudiants (6 ESD, 6 ESP) rangés dans 6 classes officielles, 3 numéros de téléphone renseignés.
- 12 annonces (8 « je propose », 4 « je cherche ») sur 6 quartiers.
- 9 demandes : 7 acceptées, 1 refusée, 1 en attente. Messages dans une discussion, 5 avis.
- 7 étudiants acceptent d'apparaître dans le fil du campus.

## Les contrôles (attendu = obtenu)
| Contrôle | Attendu | Obtenu |
|---|---|---|
| Étudiants rangés dans leur classe | 12 | 12 |
| Léa voit le numéro de Sam avant acceptation | 0 | 0 |
| Léa voit le numéro de Sam après acceptation | 1 | 1 |
| Jade (demande en attente) voit le numéro de Hugo | 0 | 0 |
| Enzo (demande refusée) voit le numéro de Noé | 0 | 0 |
| Tom lit la discussion de Léa et Sam | 0 | 0 |
| Sam lit sa discussion avec Léa | 2 | 2 |
| Entraides visibles dans le fil (accord des deux) | 4 | 4 |
| Le fil, ligne par ligne | lina→lea, noe→clara, sam→lea, tom→maya | identique |
| Notifications reçues par Sam | au moins 3 | 4 |
| Sam voit les notifications des autres | 0 | 0 |
| Bureau de Hugo : demandes à traiter | 1 | 1 |
| Stats (aides données / reçues / croisements / avis) des 11 étudiants actifs | cohérentes avec le scénario | ex. Sam 1 / 1 / 2 / 1, Léa 0 / 2 / 2 / 0 |
| Carte : annonces par quartier | centre 3, puis 2 par quartier | identique |
| Compteur public d'impact | 12 étudiants simulés et plus, 7 entraides | 13 étudiants, 12 annonces, 7 entraides, 5 croisements |

Le script complet a été exécuté via le MCP Supabase (même structure que les autres tests de `supabase/tests/`).
Ce que la simulation ne remplace pas : le test à la main dans le navigateur, sur téléphone (`docs/RECETTE.md`).
