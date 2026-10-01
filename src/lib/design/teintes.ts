import type { Categorie } from "@/lib/annonces/validation";

// Les couleurs de bandeau de la charte ESP 2026, une par famille de catégories.
// Les classes sont écrites en entier pour que Tailwind les repère dans le code.
export const TEINTES = {
  lilas: { couche: "teinte-lilas", point: "bg-lilas", famille: "Créa" },
  ciel: { couche: "teinte-ciel", point: "bg-ciel", famille: "Tech" },
  bandeau: { couche: "teinte-bandeau", point: "bg-bandeau", famille: "Projets" },
  ocre: { couche: "teinte-ocre", point: "bg-ocre", famille: "Vie de campus" },
} as const;

export type Teinte = keyof typeof TEINTES;

export const TEINTE_CATEGORIE = {
  photo: "lilas",
  video: "lilas",
  design: "lilas",
  shooting: "lilas",
  ux_ui: "ciel",
  dev: "ciel",
  data_ia: "ciel",
  redaction: "bandeau",
  binome: "bandeau",
  coup_de_main: "bandeau",
  coloc: "ocre",
  covoiturage: "ocre",
  materiel: "ocre",
} as const satisfies Record<Categorie, Teinte>;

export function teinte(categorie: string) {
  return TEINTES[TEINTE_CATEGORIE[categorie as Categorie] ?? "bandeau"];
}
