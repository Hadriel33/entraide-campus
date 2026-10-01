// Référentiels des annonces. Les mêmes listes sont imposées en base (contraintes check, migration 0002).
export const TYPES = { propose: "Je propose", cherche: "Je cherche" } as const;

export const CATEGORIES = {
  photo: "Photo et retouche",
  video: "Vidéo et motion",
  design: "Design graphique",
  ux_ui: "UX/UI",
  dev: "Dev web et no-code",
  data_ia: "Data et IA",
  redaction: "Rédaction et réseaux sociaux",
  coloc: "Coloc et logement",
  covoiturage: "Covoiturage",
  materiel: "Prêt de matériel",
  binome: "Binôme de projet",
  shooting: "Modèle pour un shooting",
  coup_de_main: "Coup de main",
} as const;

export const CONTREPARTIES = {
  gratuit: "Gratuit",
  troc: "Troc de compétences",
  partage_frais: "Partage des frais",
  remunere: "Rémunéré",
  a_discuter: "À discuter",
} as const;

// Bordeaux : quartiers et lignes de tram (filtre « près de chez moi »). Mêmes listes en base (migration 0014).
export const QUARTIERS = {
  victor_hugo: "Victor Hugo (campus)",
  centre: "Centre, Saint-Pierre",
  chartrons: "Chartrons",
  saint_michel: "Saint-Michel, Capucins",
  saint_jean: "Gare Saint-Jean",
  bastide: "La Bastide",
  bacalan: "Bacalan, Bassins à flot",
  cauderan: "Caudéran",
  talence_pessac: "Talence, Pessac (campus universitaire)",
  merignac: "Mérignac",
  begles: "Bègles",
  hors_bordeaux: "Hors Bordeaux",
} as const;

export const TRAMS = ["A", "B", "C", "D"] as const;

export type TypeAnnonce = keyof typeof TYPES;
export type Quartier = keyof typeof QUARTIERS;
export type Tram = (typeof TRAMS)[number];
export type Categorie = keyof typeof CATEGORIES;
export type Contrepartie = keyof typeof CONTREPARTIES;

export type ValeursAnnonce = {
  type: TypeAnnonce;
  categorie: Categorie;
  titre: string;
  description: string;
  contrepartie: Contrepartie;
  lieu: string | null;
  quartier: Quartier | null;
  tram: Tram | null;
};

type Champ = keyof ValeursAnnonce;

export function validerAnnonce(champs: Record<Exclude<Champ, "quartier" | "tram">, string> & Partial<Record<"quartier" | "tram", string>>): {
  ok: boolean;
  erreurs: Partial<Record<Champ, string>>;
  valeurs?: ValeursAnnonce;
} {
  const erreurs: Partial<Record<Champ, string>> = {};
  const titre = champs.titre.trim();
  const description = champs.description.trim();
  const lieu = champs.lieu.trim();

  if (!(champs.type in TYPES)) erreurs.type = "Choisis « Je propose » ou « Je cherche ».";
  if (!(champs.categorie in CATEGORIES)) erreurs.categorie = "Choisis une catégorie.";
  if (titre.length < 5) erreurs.titre = "5 caractères minimum.";
  else if (titre.length > 80) erreurs.titre = "80 caractères maximum.";
  if (description.length < 20) erreurs.description = "20 caractères minimum : décris ce que tu proposes ou cherches.";
  else if (description.length > 1000) erreurs.description = "1000 caractères maximum.";
  if (!(champs.contrepartie in CONTREPARTIES)) erreurs.contrepartie = "Choisis une contrepartie.";
  if (lieu.length > 80) erreurs.lieu = "80 caractères maximum.";
  const quartier = (champs.quartier ?? "").trim();
  const tram = (champs.tram ?? "").trim();
  if (quartier && !(quartier in QUARTIERS)) erreurs.quartier = "Quartier inconnu.";
  if (tram && !(TRAMS as readonly string[]).includes(tram)) erreurs.tram = "Ligne de tram inconnue.";

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };

  return {
    ok: true,
    erreurs,
    valeurs: {
      type: champs.type as TypeAnnonce,
      categorie: champs.categorie as Categorie,
      titre,
      description,
      contrepartie: champs.contrepartie as Contrepartie,
      lieu: lieu || null,
      quartier: (quartier || null) as Quartier | null,
      tram: (tram || null) as Tram | null,
    },
  };
}
