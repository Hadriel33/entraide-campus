---
name: anti-ia-design
description: Checklist pour éviter le look « généré par IA » (design et textes). À utiliser avant de créer ou retoucher une page, un composant ou un texte visible par l'utilisateur, et pour auditer une page avant la démo.
---

# Éviter le look « fait par une IA »

Repris de la veille design de padel-snipe (9 sources, dont le scoreur Show HN d'Adrian Krebs). Pour la recherche de palettes, polices et styles, combine avec le skill `ui-ux-pro-max`.

## Le score rapide (16 signaux)
Compte les signaux présents sur la page : **0–1 = OK, 2–3 = moyen, 4+ = « slop »**.
1. Inter partout. 2. Combo Space Grotesk / Instrument Serif / Geist. 3. Serif italique sur un seul mot d'accent. 4. Violet / indigo. 5. Mode sombre imposé. 6. Texte peu contrasté sur fond sombre. 7. Dégradés de fond. 8. Halos colorés. 9. Hero centré en police sans générique. 10. Badge au-dessus du titre. 11. Bordure colorée en haut ou à gauche des cartes. 12. Grille de cartes avec icône. 13. Étapes numérotées 01/02/03. 14. Bandeau de statistiques. 15. Menu avec emojis. 16. Libellés en MAJUSCULES espacées.

## Règle dure sur les textes
**Zéro emoji et zéro tiret cadratin « — »** dans tout texte vu par l'utilisateur. Utilise la ponctuation classique (« : », « . », deux phrases) et des icônes `lucide-react` à la place des pictogrammes. Le « – » est toléré pour une plage (« 18h–20h »).
À bannir aussi : « Il ne s'agit pas seulement de X, c'est Y », les triades (« rapide, simple et efficace »), les mots creux (révolutionner, booster, fluide, écosystème, sans effort), les titres vagues. Préférer des textes précis, à la voix d'un étudiant : « Sam fait des photos pour vos soirées d'asso ».

## Ce qui fait « fait main »
- Une direction verrouillée : au plus 3 teintes (dominante, un accent saturé utilisé avec parcimonie, une rampe de gris).
- Fond blanc cassé plutôt que `#fff`. Titres serrés (line-height ≤ 1, letter-spacing négatif), échelle fluide en `clamp()`.
- Cartes séparées par **l'espace** avant les bordures. Rythme d'espacement varié entre les sections.
- Contraste **mesuré** (AA minimum), pas estimé à l'œil.
- De **vraies** données dans les écrans de démo : de vraies annonces crédibles, jamais « test test » ni Lorem ipsum (consigne du cours pour la démo finale).
- Animation seulement quand elle communique un état (chargement, succès, erreur).

## Audit d'une page (format)
| Signal | Preuve dans le code | Gravité | Correction |
|---|---|---|---|
Puis « Ce qu'on garde », puis la liste des corrections, de la plus visible à la moins visible.

## Lien avec le thème
La DA vit dans les jetons de `globals.css`. Pour en changer, utilise le skill `adapter-front`. Le test `front-portable` bloque les emojis, les tirets cadratins et les couleurs en dur.
