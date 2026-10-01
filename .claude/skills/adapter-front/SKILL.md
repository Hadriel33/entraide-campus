---
name: adapter-front
description: Migrer le front vers n'importe quelle référence visuelle (une piste de docs/DA.md, l'URL d'un site, une capture, une charte). À utiliser pour changer de direction artistique, appliquer une DA choisie, ou créer un composant qui doit rester compatible avec tous les thèmes.
---

# Adapter le front à une référence

Principe (consigne du prof) : le front ne dépend d'**aucune** DA en particulier. Toute l'identité visuelle tient dans les **jetons** de `src/app/globals.css`, et les composants n'utilisent que ces jetons. Changer de référence ne demande donc de modifier qu'un seul fichier (plus le chargement des polices).

## Contrat des jetons (ne pas renommer, seulement changer les valeurs)
| Jeton | Classe Tailwind | Rôle |
|---|---|---|
| `--color-papier` | `bg-papier` | Fond de page |
| `--color-papier-fonce` | `bg-papier-fonce` | Surfaces, encadrés |
| `--color-encre` | `text-encre`, `bg-encre` | Texte principal, bouton plein |
| `--color-encre-douce` | `text-encre-douce` | Texte secondaire |
| `--color-ligne` | `border-ligne` | Bordures, filets |
| `--color-accent` | `bg-accent`, `text-accent` | Mise en avant, survol (avec parcimonie) |
| `--color-alerte` | `text-alerte` | Erreurs |
| `--font-sans` / `--font-titre` | `font-sans` / `font-titre` | Texte / titres |
| `--radius-ui` | `rounded-ui` | Arrondi des champs et boutons |

Modèle complet à copier : [modeles/theme.css](modeles/theme.css).

## Procédure de migration vers une référence
1. **Lire la référence** : une piste de `docs/DA.md`, une URL (récupérer le CSS réel, ne rien deviner) ou une capture. Pour explorer palettes et polices, utilise le skill `ui-ux-pro-max` (`python .claude/skills/ui-ux-pro-max/scripts/search.py "<mots-clés>" --design-system`).
2. **Extraire** : 3 teintes au maximum (dominante, accent, rampe de neutres), 2 polices (titres, texte) disponibles sur Google Fonts, un arrondi.
3. **Vérifier le contraste** (AA, 4,5:1 minimum) de `encre` sur `papier`, de `encre-douce` sur `papier` et de `papier` sur `encre`. Le mesurer, pas l'estimer à l'œil.
4. **Appliquer** : remplacer les valeurs dans `@theme` (`globals.css`). Charger les polices avec `next/font/google` dans `layout.tsx` et brancher leurs variables sur `--font-sans` et `--font-titre`.
5. **Contrôler** : `npm test` (le test `front-portable` refuse toute couleur en dur), `npm run build`, la checklist du skill `anti-ia-design`, puis la page sur téléphone.
6. **Documenter** : quelle référence, pourquoi, et une capture avant/après dans `docs/METHODE.md` (tableau des décisions).

## Écrire un composant compatible avec tous les thèmes
- Uniquement des classes de jetons (`bg-encre`, `border-ligne`, `rounded-ui`, `font-titre`). Jamais `#hex`, `rgb()`, `bg-zinc-500` ni `rounded-md`.
- Les composants partagés vivent dans `src/components/ui/` : réutiliser `Bouton`, `BoutonLien` et `Champ` avant d'en créer un nouveau.
- Modèle : [modeles/composant.tsx](modeles/composant.tsx).
