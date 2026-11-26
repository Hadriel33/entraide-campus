// Boîte à suggestions : un retour libre vers l'équipe (idée, bug, autre). Mêmes règles que la base (migration 0038).
export const CATEGORIES_SUGGESTION = { idee: "Une idée", bug: "Un bug", autre: "Autre chose" } as const;
export type CategorieSuggestion = keyof typeof CATEGORIES_SUGGESTION;
export const TEXTE_MIN = 10;
export const TEXTE_MAX = 1000;

export function validerSuggestion(brut: { categorie: unknown; texte: unknown }):
  | { ok: true; valeurs: { categorie: CategorieSuggestion; texte: string } }
  | { ok: false; erreur: string } {
  const categorie = String(brut.categorie ?? "");
  const texte = String(brut.texte ?? "").trim();
  if (!(categorie in CATEGORIES_SUGGESTION)) return { ok: false, erreur: "Choisis ce que c'est : une idée, un bug ou autre chose." };
  if (texte.length < TEXTE_MIN) return { ok: false, erreur: `Dis-nous en un peu plus (${TEXTE_MIN} caractères au moins).` };
  if (texte.length > TEXTE_MAX) return { ok: false, erreur: `${TEXTE_MAX} caractères maximum.` };
  return { ok: true, valeurs: { categorie: categorie as CategorieSuggestion, texte } };
}
