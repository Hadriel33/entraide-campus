# Direction artistique

## V2 (01/10, après retour de Hadriel) : « moderne, dashboard SaaS, inspiré de l'ESD et de l'ESP »
Planche de maquettes : https://claude.ai/artifact/BZQNr7ohGZZejXGKL5384i (kit UI, tableau de bord et mobile pour chaque piste).
Point de départ : les **vrais codes** relevés dans le CSS des sites ecole-du-digital.com et espub.org, qui partagent le même système : encre `#1B2027`, fonds `#F5F7FA` et `#EBEEF9`, gris `#98A3B3`, bleu ESP `#28367F`, bleu vif `#3D5CF5`, orange `#F6A151`, rouge `#E84545`, marine `#0A2240`, police DM Sans.
La même interface est déclinée en 3 pistes : **seuls les jetons changent**, ce qui démontre le front portable (skill `adapter-front`).

| Piste | Idée | Couleurs | Polices | Arrondi |
|---|---|---|---|---|
| **A · Campus** | Fidèle au système du groupe ESD/ESP, sobre, de type Linear/Notion | fond `#F5F7FA`, encre `#1B2027`, principale `#28367F`, accent `#3D5CF5` | DM Sans | 10 px |
| **B · Duo** | Une couleur par école : bleu ESD, orange ESP. Sidebar sombre | fond `#F3F4F6`, encre `#12161C`, ESD `#3D5CF5`, ESP `#F6A151` | Schibsted Grotesk + DM Sans | 8 px |
| **C · Éditorial** | Marine du groupe, titres serif (écho du Minion Pro de l'ESP), rouge en touche | fond `#F6F5F1`, marine `#0A2240`, rouge `#E84545` | Newsreader + DM Sans | 4 px |
| **D · ESP 2026** | La **nouvelle DA de l'ESP** (Instagram @esp_ecole, sept. 2026) : affiches avec un verbe géant (EXISTER, SIGNER, PENSER) posé sur un bandeau de couleur, « ESP. » noir sur rouge, une ligne en serif | fond `#FAF9F6`, encre `#111111`, rouge `#D7141A` (action), bandeaux jaune `#F3E54A`, lilas `#CDBDEB`, ocre `#C98A1F`, ciel `#BCD3EC` | Archivo condensé 900 en capitales + Source Serif 4 + DM Sans | 0 px |

| **E · Campus 2026** (retenue en finale) | Choix de Hadriel : « entre A et D, clean, moderne, qui respecte la nouvelle charte ». La structure de A (sidebar claire, arrondis doux, beaucoup d'air) et les signatures de D, dosées : titres Archivo condensé en capitales, **un seul** bandeau jaune (le titre de page), rouge réservé aux compteurs et alertes, accroche en serif, badges aux couleurs des bandeaux adoucies | fond `#FAFAF8`, encre `#111111`, boutons noirs, rouge `#D7141A` en touche, jaune `#F3E54A`, lilas `#E6DDF7`, ciel `#DCE8F6` | Archivo condensé 800 + Source Serif 4 + DM Sans | 6 / 10 px |

Écartés : la proposition violette et Fira du skill `ui-ux-pro-max` (le violet est le signal n°4 de la checklist anti-IA), le mode sombre imposé (signal n°5), et les logos officiels (projet non officiel).

---

## V4 (01/10, soir) : « le mur du campus », on s'amuse

Demande de Hadriel : travailler l'identité, les espacements, la taille des textes, la hiérarchie, des demandes « en post-it », un effet wow pour la démo.
- **Métaphore unique : le tableau d'affichage du campus.** Fond pointillé de carnet sur toute l'appli. Chaque annonce est un **post-it** : papier pâle de la couleur de sa famille, légère inclinaison propre à l'annonce (calculée depuis son id, stable), scotch translucide, coin bas qui rebique. Au survol il se redresse et se décolle.
- **Demandes = tableau de post-it punaisés** en deux colonnes « À traiter » / « En contact », les refusées repliées en bas. Le message de l'étudiant est écrit à la main.
- **Écriture à la main (Kalam)** pour les annotations seulement : la contrepartie griffonnée en rouge (« Gratuit ! », « Troc »), les notes à côté des titres de section, les états vides. Jamais pour un texte long.
- **Hiérarchie** : échelle de texte en jetons (`text-affiche`, `text-titre` fluides en `clamp()`, `text-section`), titres de page plus grands, accroche serif limitée en largeur, 32 px entre sections, recherche mise en avant et filtres secondaires repliés dans « Plus de filtres ».
- **Moments de joie** : confettis aux couleurs de la charte quand une demande est acceptée, une annonce publiée ou un avis laissé (CSS pur, coupés si « réduire les animations »).
- **Le mur en direct** (`/mur`) : à projeter pendant la démo. Les annonces publiées depuis un téléphone tombent sur le mur en temps réel, avec un mode plein écran.

## V3 (01/10, soir) : plus de couleur, « effet de couche fin »

Retour de Hadriel : la nouvelle DA de l'ESP a plus de couleur que notre piste E. On reprend les bandeaux de la charte (relevés sur Instagram @esp_ecole : jaune, lilas, ciel, ocre) :
- **Une teinte par famille de catégories** : lilas = créa (photo, vidéo, design, shooting), ciel = tech (UX/UI, dev, data), jaune = projets (rédaction, binôme, coup de main), ocre = vie de campus (coloc, covoit, matériel). Pastille de couleur devant la catégorie, toujours avec le texte.
- **Couche fine** : un aplat de couleur décalé de 3 px derrière les cartes, comme deux affiches superposées. Au survol, la carte se soulève et la couche s'élargit. Le titre de page jaune a une couche lilas, le bouton principal une couche jaune au survol, le logo deux couches.
- **Accueil en affiche** : PROPOSE / CHERCHE / ENTRAIDE-TOI sur trois bandeaux décalés, à la manière des affiches EXISTER / SIGNER de l'ESP.
- Les couleurs ne servent jamais pour du texte (contraste) ; elles sont dans `globals.css` et `src/lib/design/teintes.ts`, donc migrables avec le skill `adapter-front`.

## V1 (01/10, matin) : premières pistes, avant la consigne « dashboard SaaS »

Contraintes : ne pas ressembler à padel-snipe (navy et vert fluo, sport), ne pas imiter les chartes ESD et ESP (projet étudiant non officiel : pas de logo, pas de bleu-sarcelle, pas de noir pur dominant), et passer la checklist du skill `anti-ia-design`.
Le front est piloté par des **jetons** (`src/app/globals.css`) : changer de piste = appliquer le skill `adapter-front` avec la référence choisie.

## A. « Tableau de liège »
Le panneau d'affichage du hall : des annonces punaisées, légèrement de travers, avec des notes manuscrites.
- Palette : kraft `#B5895B`, punaise rouge `#E2462B`, papier `#F6F0E4`
- Polices : Bricolage Grotesque (titres), Atkinson Hyperlegible (texte), Caveat (annotations, rarement)
- Références : padlet.com, tldraw.com, maggieappleton.com/garden
- Pourquoi : on reprend le geste réel du campus. C'est tactile et très loin du look « IA ».

## B. « Fanzine riso »
Impression risographie en deux couleurs, avec de légers décalages, des aplats en surimpression et du grain.
- Palette : bleu riso `#3255A4`, rose fluo `#FF48B0`, papier `#F3EEE3`
- Polices : Syne (titres), Karla (texte), IBM Plex Mono (métadonnées)
- Références : stencil.wiki (encres riso), hatopress.net, faustinedelbourg.com (atelier riso bordelais)
- Pourquoi : la culture créa et pub de l'ESP. On peut même imprimer de vraies affiches pour le campus.

## C. « La Gazette des petites annonces »
Un journal de quartier : colonnes, filets, annonces numérotées, typo serif.
- Palette : bordeaux `#6B1E2E`, pierre blonde `#D9A441`, papier journal `#F5F1EA`
- Polices : Instrument Serif (titres), Public Sans (texte)
- Références : la structure des annonces de craigslist.org, itsnicethat.com, kinfolk.com
- Pourquoi : la couleur du vin et la pierre des façades ancrent l'appli à Bordeaux. Le format « petites annonces » correspond exactement à l'offre et la demande.

## Contexte (recherche du 01/10/2026)
- ESD (École Supérieure du Digital) et ESP (École Supérieure de Publicité) font partie du Groupe ESP-ESD (AD Education). Leur campus commun à Bordeaux : 11 place de la Ferme de Richemont, plus une annexe place des Basques. Le BDE est commun. Selon le site officiel, l'ESD sera intégrée à l'ESP à la rentrée 2027 : le nom neutre « L'entraide du campus » reste donc valable.
- Complémentarité : tech, data et UX côté ESD ; com, créa et pub côté ESP. Les mises en relation croisées sont l'atout de l'appli.
- Concurrents : groupes Facebook (non vérifiés, coordonnées exposées), La Carte des Colocs (logement uniquement), Karos (covoiturage, ESD et ESP absents des partenaires), StudentPop (missions payantes avec commission), Discord ou WhatsApp du BDE (messages perdus, numéros visibles).
- Différenciation : réservé au campus, coordonnées après accord, croisement ESD × ESP, annonces logement et covoiturage qui expirent, contrepartie affichée (troc, gratuit, rémunéré).
- Catégories proposées : *Je propose* (photo et retouche, vidéo et motion, design graphique, UX/UI, dev web et no-code, data et IA, community management et rédaction) ; *Je cherche* (coloc ou sous-location, covoiturage, prêt de matériel, binôme de projet, modèle pour un shooting, coup de main).
