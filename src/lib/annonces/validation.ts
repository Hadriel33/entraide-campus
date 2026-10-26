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
  // Paris (campus du 15e)
  paris_campus: "Convention, Vaugirard (campus)",
  paris_montparnasse: "Montparnasse",
  paris_quartier_latin: "Quartier latin",
  paris_marais: "Le Marais",
  paris_bastille: "Bastille",
  paris_republique: "République, Canal Saint-Martin",
  paris_montmartre: "Montmartre, Pigalle",
  paris_batignolles: "Batignolles",
  paris_belleville: "Belleville",
  paris_gare_de_lyon: "Gare de Lyon, Bercy",
  paris_issy_boulogne: "Issy, Boulogne",
  // Lyon
  lyon_campus: "Jean Jaurès (campus)",
  lyon_bellecour: "Bellecour, Presqu'île",
  lyon_part_dieu: "Part-Dieu",
  lyon_croix_rousse: "Croix-Rousse",
  lyon_vieux_lyon: "Vieux Lyon",
  lyon_confluence: "Confluence",
  lyon_guillotiere: "Guillotière",
  lyon_villeurbanne: "Villeurbanne",
  lyon_gerland: "Gerland",
  lyon_monplaisir: "Monplaisir",
  // Toulouse
  toulouse_campus: "La Cartoucherie (campus)",
  toulouse_capitole: "Capitole",
  toulouse_carmes: "Les Carmes",
  toulouse_saint_cyprien: "Saint-Cyprien",
  toulouse_compans: "Compans-Caffarelli",
  toulouse_minimes: "Les Minimes",
  toulouse_matabiau: "Matabiau",
  toulouse_rangueil: "Rangueil (université)",
  toulouse_purpan: "Purpan",
  toulouse_saint_agne: "Saint-Agne",
  // Nantes
  nantes_campus: "Canclaux, rue Fulton (campus)",
  nantes_centre: "Bouffay, Commerce",
  nantes_graslin: "Graslin",
  nantes_ile_de_nantes: "Île de Nantes",
  nantes_chantenay: "Chantenay",
  nantes_gare: "Gare, Jardin des plantes",
  nantes_erdre: "Erdre, faculté",
  nantes_reze: "Rezé",
  nantes_doulon: "Doulon",
  nantes_saint_herblain: "Saint-Herblain",
  // Lille
  lille_campus: "Avenue de la République (campus)",
  lille_vieux_lille: "Vieux-Lille",
  lille_centre: "Grand-Place",
  lille_wazemmes: "Wazemmes",
  lille_euralille: "Euralille",
  lille_moulins: "Moulins",
  lille_vauban: "Vauban",
  lille_villeneuve_ascq: "Villeneuve-d'Ascq",
  lille_marcq: "Marcq-en-Barœul",
  lille_lambersart: "Lambersart",
  // Commun à tous les campus (clé historique, gardée pour les annonces existantes)
  hors_bordeaux: "Ailleurs, hors de la ville",
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
