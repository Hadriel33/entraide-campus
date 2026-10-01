import type { Categorie } from "@/lib/annonces/validation";

// Titres de spécialité : on devient « Photographe du campus » en aidant 3 personnes différentes en photo.
// Le nombre de personnes aidées par catégorie vient de la base (stats_profil -> aides_par_categorie).
export const SEUIL_TITRE = 3;

export const TITRES: Record<Categorie, string> = {
  photo: "Photographe du campus",
  video: "Vidéaste du campus",
  design: "Designer du campus",
  ux_ui: "UX designer du campus",
  dev: "Dev du campus",
  data_ia: "Data du campus",
  redaction: "Plume du campus",
  coloc: "Hôte du campus",
  covoiturage: "Chauffeur du campus",
  materiel: "Prêteur du campus",
  binome: "Binôme de choc",
  shooting: "Modèle du campus",
  coup_de_main: "Bras droit du campus",
};

export function titresObtenus(aidesParCategorie: Partial<Record<string, number>>) {
  return (Object.entries(aidesParCategorie) as [Categorie, number][])
    .filter(([c, n]) => c in TITRES && n >= SEUIL_TITRE)
    .sort((a, b) => b[1] - a[1])
    .map(([categorie, aides]) => ({ categorie, aides, titre: TITRES[categorie] }));
}

export function titrePrincipal(aidesParCategorie: Partial<Record<string, number>>, niveau: string): string {
  return titresObtenus(aidesParCategorie)[0]?.titre ?? niveau;
}
