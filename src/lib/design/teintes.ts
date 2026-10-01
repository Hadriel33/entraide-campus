import type { Categorie } from "@/lib/annonces/validation";

// Les couleurs de bandeau de la charte ESP 2026, une par famille de catégories.
// Les classes sont écrites en entier pour que Tailwind les repère dans le code.
export const TEINTES = {
  lilas: { couche: "teinte-lilas", point: "bg-lilas", papier: "papier-lilas", bordure: "border-lilas", famille: "Créa" },
  ciel: { couche: "teinte-ciel", point: "bg-ciel", papier: "papier-ciel", bordure: "border-ciel", famille: "Tech" },
  bandeau: { couche: "teinte-bandeau", point: "bg-bandeau", papier: "papier-jaune", bordure: "border-bandeau", famille: "Projets" },
  ocre: { couche: "teinte-ocre", point: "bg-ocre", papier: "papier-ocre", bordure: "border-ocre", famille: "Vie de campus" },
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

// Inclinaison d'un post-it entre -2,4° et 2,4°, stable pour un même id (pas d'aléatoire au rendu).
export function inclinaison(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 49) - 24) / 10;
}

export function teinte(categorie: string) {
  return TEINTES[TEINTE_CATEGORIE[categorie as Categorie] ?? "bandeau"];
}
