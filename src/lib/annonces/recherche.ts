// Normalise la recherche : sans accents (la colonne de recherche en base est aussi sans accents),
// sans ponctuation, sans mots d'une ou deux lettres, longueur bornée.
export function normaliserRecherche(brute: string): string {
  return brute
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((m) => m.length > 2)
    .join(" ")
    .slice(0, 80)
    .trim();
}
