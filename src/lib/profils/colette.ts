// Les choix possibles pour sa Colette (mêmes listes que les contraintes de la base, migration 0017).
export const COULEURS_COLETTE = { jaune: "Jaune", lilas: "Lilas", ciel: "Ciel", ocre: "Ocre" } as const;
export const HUMEURS_COLETTE = { contente: "Contente", fiere: "Fière", surprise: "Surprise", concentree: "Concentrée" } as const;
export const ACCESSOIRES_COLETTE = {
  aucun: "Rien",
  photo: "Appareil photo",
  design: "Béret",
  dev: "Lunettes de dev",
  data: "Graphique",
  coloc: "Carton de déménagement",
  covoit: "Casquette",
  diplome: "Diplôme",
  bde: "Lunettes de soleil",
  noel: "Bonnet",
} as const;

export type ChoixColette = { colette_couleur: string; colette_humeur: string; colette_accessoire: string };

export function validerColette(brut: Record<string, unknown>): ChoixColette | null {
  const couleur = String(brut.couleur ?? "");
  const humeur = String(brut.humeur ?? "");
  const accessoire = String(brut.accessoire ?? "");
  if (!(couleur in COULEURS_COLETTE) || !(humeur in HUMEURS_COLETTE) || !(accessoire in ACCESSOIRES_COLETTE)) return null;
  return { colette_couleur: couleur, colette_humeur: humeur, colette_accessoire: accessoire };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validerClasse(brut: unknown): string | null | false {
  const v = String(brut ?? "").trim();
  if (!v) return null; // aucune classe
  return UUID.test(v) ? v : false;
}
