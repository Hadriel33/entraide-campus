# Évaluation de l'IA n°3 : le « Pour moi » intelligent

Mesure du 02/10/2026 · modèle `google/gemini-2.5-flash` · prompt `src/lib/ia/prompts/matching.ts` (v1)
Jeu : 30 paires profil/annonce annotées à la main **avant** le test (`ia-eval/matching.json`) : 3 profils × 10 annonces,
16 pertinentes, 14 non pertinentes, avec des synonymes (« Power BI » / « tableau de bord ») et des faux amis
(un python… le serpent ; le « montage » d'une armoire).

## Résultat

| | Bonnes décisions | Précision (ce qu'on montre est pertinent) | Rappel (ce qui est pertinent est montré) |
|---|---|---|---|
| Règles (mots exacts + catégories) | 22/30 (73 %) | 90 % | 56 % |
| IA n°3 (moyenne de 3 passages) | 29.0/30 (97 %) | 100 % | 94 % |

Passages de l'IA : 29/30, 29/30, 29/30. Pannes du service : 0.

## Détail (dernier passage de l'IA)

| Profil | Annonce | Attendu | Règles | IA | Raison donnée par l'IA |
|---|---|---|---|---|---|
| Monteuse vidéo (ESP) | Quelqu'un pour monter notre aftermovie | pertinente | juste | juste | Ton Premiere Pro et ton offre en Vidéo et motion correspondent parfaitement à son besoin de montage. |
| Monteuse vidéo (ESP) | Animer le logo de notre asso | pertinente | **ratée** | juste | Ton After Effects est parfait pour animer son logo. |
| Monteuse vidéo (ESP) | Montage d'une armoire IKEA | non | juste | juste |  |
| Monteuse vidéo (ESP) | Je t'aide à mettre ton portfolio en ligne | pertinente | juste | juste | Il propose l'aide en Dev web que tu cherches pour ton portfolio en ligne. |
| Monteuse vidéo (ESP) | Photographe pour notre soirée | non | juste | juste | Ton expertise en vidéo (tournage/étalonnage) a un lien faible avec la photo. |
| Monteuse vidéo (ESP) | Filmer un tournoi de foot | pertinente | juste | juste | Ton savoir-faire en Tournage correspond exactement à son besoin de filmer le tournoi. |
| Monteuse vidéo (ESP) | Je monte tes vidéos YouTube | non | juste | juste |  |
| Monteuse vidéo (ESP) | Sous-titres pour une vidéo de présentation | pertinente | **ratée** | **ratée** | Caler des sous-titres a un lien faible avec tes compétences vidéo pures. |
| Monteuse vidéo (ESP) | Avis sur ma maquette Figma | non | juste | juste |  |
| Monteuse vidéo (ESP) | Je cherche une coloc pour janvier | non | juste | juste |  |
| Dev data (ESD) | Aide Python pour mon mémoire | pertinente | juste | juste | Ton Python colle à son besoin d'aide pour nettoyer des données et faire des graphiques. |
| Dev data (ESD) | Suivre les adhérents de notre asso | pertinente | **ratée** | juste | Ton Power BI colle à son besoin d'un tableau de bord pour suivre les inscriptions. |
| Dev data (ESD) | Nourrir mon python en août | non | **montrée à tort** | juste |  |
| Dev data (ESD) | Montage de tes vidéos | pertinente | juste | juste | Cette annonce correspond exactement à ton besoin d'aide en montage vidéo. |
| Dev data (ESD) | Mon site WordPress plante | pertinente | juste | juste | Tu proposes de l'aide en Dev web et no-code, ce qui correspond à son besoin WordPress. |
| Dev data (ESD) | Logo pour mon asso | non | juste | juste |  |
| Dev data (ESD) | Organiser les commandes de ma boutique | pertinente | **ratée** | juste | Ton SQL colle à son besoin d'organiser commandes et clients dans une base de données. |
| Dev data (ESD) | Je t'explique Excel | non | juste | juste |  |
| Dev data (ESD) | Shooting pour ma marque | non | juste | juste |  |
| Dev data (ESD) | Covoit le jeudi soir | non | juste | juste |  |
| Designer UX (ESP) | Avis UX sur mon appli | pertinente | juste | juste | Ton Tests utilisateurs correspond parfaitement à son besoin de tester son prototype. |
| Designer UX (ESP) | Des écrans propres avant de coder | pertinente | **ratée** | juste | Tes compétences Figma et UX/UI sont parfaites pour créer ses maquettes d'écrans. |
| Designer UX (ESP) | Affiche pour notre gala | pertinente | juste | juste | Ton Design graphique et Illustrator sont exactement ce qu'il lui faut pour son affiche. |
| Designer UX (ESP) | Chambre libre dans notre coloc | pertinente | juste | juste | Cette annonce de coloc correspond exactement à ton besoin en logement. |
| Designer UX (ESP) | Choisir une police pour mon CV | pertinente | **ratée** | juste | Ta compétence en Typographie est parfaite pour ses choix de police et mise en page. |
| Designer UX (ESP) | Atelier Figma pour débutants | non | juste | juste |  |
| Designer UX (ESP) | Aide Python | non | juste | juste |  |
| Designer UX (ESP) | Monteur pour un clip | non | juste | juste |  |
| Designer UX (ESP) | Je cherche un vélo | non | juste | juste |  |
| Designer UX (ESP) | Tester notre prototype avec de vrais étudiants | pertinente | **ratée** | juste | Ta compétence Tests utilisateurs est idéale pour organiser ces sessions de test. |

## Ce qu'on en retient
- Les règles ratent les besoins écrits avec d'autres mots, et se trompent sur les faux amis (un « python » qui est un serpent).
- L'IA est appelée **à la demande** seulement (bouton « Demander à Colette ») : une requête, 40 annonces, quelques secondes.
- Si l'IA est indisponible, l'appli garde le classement par règles : rien ne casse.
- Seules les compétences et les catégories partent vers le modèle : ni nom, ni CV, ni coordonnées.

