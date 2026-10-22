import type { Categorie } from "@/lib/annonces/validation";

// Une forme de post-it par type d'annonce : on reconnaît un covoit ou une coloc avant de lire.
// Les cours et compétences gardent le post-it classique (la couleur dit la famille, cf. teintes.ts).
export const FORMES = ["classique", "billet", "languettes", "etiquette", "polaroid", "duo"] as const;
export type Forme = (typeof FORMES)[number];

const FORME_CATEGORIE: Partial<Record<Categorie, Forme>> = {
  covoiturage: "billet", // un billet de trajet, avec ses encoches
  coloc: "languettes", // la petite annonce de laverie, avec ses languettes à arracher
  materiel: "etiquette", // l'étiquette cartonnée accrochée à l'objet prêté
  shooting: "polaroid",
  binome: "duo", // deux post-it l'un sur l'autre
};

export function forme(categorie: string): Forme {
  return FORME_CATEGORIE[categorie as Categorie] ?? "classique";
}
