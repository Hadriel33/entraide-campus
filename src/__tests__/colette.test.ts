import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { ACCESSOIRES_COLETTE, COULEURS_COLETTE, HUMEURS_COLETTE, MOTIFS_COLETTE, estDebloque, validerClasse, validerColette, validerNomClasse } from "@/lib/profils/colette";
import type { Stats } from "@/lib/gamification/progression";

const vide: Stats = { annonces: 0, categories: 0, aides_donnees: 0, aides_recues: 0, croisements: 0, nb_avis: 0, note_moyenne: null, aides_par_categorie: {}, defis_reussis: 0 };

describe("réglages de Colette et de la classe", () => {
  it("accepte un choix de la liste", () => {
    expect(validerColette({ couleur: "lilas", humeur: "fiere", accessoire: "photo", motif: "ligne" })).toEqual({
      colette_couleur: "lilas",
      colette_humeur: "fiere",
      colette_accessoire: "photo",
      colette_motif: "ligne",
    });
  });
  it("refuse une valeur inventée", () => {
    expect(validerColette({ couleur: "fluo", humeur: "fiere", accessoire: "photo" })).toBeNull();
    expect(validerColette({ couleur: "jaune", humeur: "fiere", accessoire: "<script>" })).toBeNull();
    expect(validerColette({ couleur: "jaune", humeur: "fiere", accessoire: "aucun", motif: "léopard" })).toBeNull();
  });
  it("classe : vide = aucune, uuid accepté, le reste refusé ; nom de classe borné", () => {
    expect(validerClasse("")).toBeNull();
    expect(validerClasse("8f2c1e9a-1b2c-4d5e-9f00-123456789abc")).toBe("8f2c1e9a-1b2c-4d5e-9f00-123456789abc");
    expect(validerClasse("M1 Data")).toBe(false);
    expect(validerNomClasse("  M1   Data  ")).toBe("M1 Data");
    expect(validerNomClasse("x")).toBeNull();
  });
});

describe("garde-robe : mêmes conditions que la base (migration 0018)", () => {
  it("un nouveau a les objets libres, pas les objets à gagner", () => {
    expect(estDebloque(ACCESSOIRES_COLETTE.casque, vide)).toBe(true);
    expect(estDebloque(ACCESSOIRES_COLETTE.cape, vide)).toBe(false);
    expect(estDebloque(MOTIFS_COLETTE.dore, vide)).toBe(false);
  });
  it("les objets se débloquent avec les vraies stats", () => {
    expect(estDebloque(ACCESSOIRES_COLETTE.noeud, { ...vide, annonces: 1 })).toBe(true);
    expect(estDebloque(ACCESSOIRES_COLETTE.cape, { ...vide, aides_donnees: 3 })).toBe(true);
    expect(estDebloque(ACCESSOIRES_COLETTE.couronne, { ...vide, nb_avis: 3, note_moyenne: 4.4 })).toBe(false);
    expect(estDebloque(ACCESSOIRES_COLETTE.couronne, { ...vide, nb_avis: 3, note_moyenne: 4.5 })).toBe(true);
    expect(estDebloque(MOTIFS_COLETTE.quadrille, { ...vide, categories: 3 })).toBe(true);
  });
});

describe("nouvelles pièces : on les gagne en revenant et en participant (migration 0027)", () => {
  it("la fleur et la marinière sont libres", () => {
    expect(estDebloque(ACCESSOIRES_COLETTE.fleur, vide)).toBe(true);
    expect(estDebloque(MOTIFS_COLETTE.mariniere, vide)).toBe(true);
  });
  it("le micro se gagne en commentant 3 fois, les lunettes cœur avec 5 réactions reçues", () => {
    expect(estDebloque(ACCESSOIRES_COLETTE.micro, { ...vide, commentaires: 2 })).toBe(false);
    expect(estDebloque(ACCESSOIRES_COLETTE.micro, { ...vide, commentaires: 3 })).toBe(true);
    expect(estDebloque(ACCESSOIRES_COLETTE.lunettes_coeur, { ...vide, reactions_recues: 4 })).toBe(false);
    expect(estDebloque(ACCESSOIRES_COLETTE.lunettes_coeur, { ...vide, reactions_recues: 5 })).toBe(true);
  });
  it("la série de semaines débloque le motif étoilé (2) et la flamme (3)", () => {
    expect(estDebloque(MOTIFS_COLETTE.etoiles, { ...vide, serie: 1 })).toBe(false);
    expect(estDebloque(MOTIFS_COLETTE.etoiles, { ...vide, serie: 2 })).toBe(true);
    expect(estDebloque(ACCESSOIRES_COLETTE.flamme, { ...vide, serie: 2 })).toBe(false);
    expect(estDebloque(ACCESSOIRES_COLETTE.flamme, { ...vide, serie: 3 })).toBe(true);
  });
  it("une stat absente (ancienne base) ne débloque rien", () => {
    expect(estDebloque(ACCESSOIRES_COLETTE.micro, vide)).toBe(false);
  });
  it("chaque pièce à gagner dit comment l'obtenir", () => {
    for (const o of [...Object.values(ACCESSOIRES_COLETTE), ...Object.values(MOTIFS_COLETTE)]) {
      if (o.condition) expect(o.aide).toBeTruthy();
    }
  });
});

describe("tenues libres (migration 0030) : de quoi personnaliser, sans rien de plus à gagner", () => {
  it("le bob, le bandana et le ballon sont libres pour tout le monde", () => {
    for (const p of ["bob", "bandana", "ballon"]) {
      expect(ACCESSOIRES_COLETTE[p], p).toBeDefined();
      expect(estDebloque(ACCESSOIRES_COLETTE[p], vide), p).toBe(true);
    }
  });
});

// Retour de Hadriel (26/11) : « c'est marrant d'avoir sa Colette personnalisée, il faut plus d'éléments ».
// Des choix LIBRES (rien à gagner) : deux couleurs, trois humeurs, quatre tenues.
describe("garde-robe élargie (migration 0037) : plus de choix, tous libres", () => {
  it("accepte les nouvelles couleurs et humeurs", () => {
    for (const couleur of ["menthe", "rose"]) {
      expect(validerColette({ couleur, humeur: "contente", accessoire: "aucun", motif: "uni" }), couleur).not.toBeNull();
    }
    for (const humeur of ["rit", "dort", "fachee"]) {
      expect(validerColette({ couleur: "jaune", humeur, accessoire: "aucun", motif: "uni" }), humeur).not.toBeNull();
    }
  });
  it("les quatre nouvelles tenues sont libres", () => {
    for (const p of ["lunettes_rondes", "moustache", "casquette", "antennes"]) {
      expect(ACCESSOIRES_COLETTE[p], p).toBeDefined();
      expect(estDebloque(ACCESSOIRES_COLETTE[p], vide), p).toBe(true);
    }
  });
});

// La base refuse ce qu'elle ne connaît pas : ses listes (dernière contrainte de chaque colonne) = celles du code.
describe("mêmes listes dans la base et dans le code", () => {
  const dossier = path.resolve(__dirname, "../../supabase/migrations");
  const sql = readdirSync(dossier).sort().map((f) => readFileSync(path.join(dossier, f), "utf8")).join("\n");
  const derniere = (colonne: string) => {
    const blocs = [...sql.matchAll(new RegExp(`check \\(${colonne} in \\(([^)]*)\\)`, "g"))];
    const valeurs = [...blocs.at(-1)![1].matchAll(/'([^']*)'/g)].map((m) => m[1]).filter(Boolean);
    return valeurs.sort();
  };
  it("couleurs, humeurs, tenues et motifs", () => {
    expect(derniere("colette_couleur")).toEqual(Object.keys(COULEURS_COLETTE).sort());
    expect(derniere("colette_humeur")).toEqual(Object.keys(HUMEURS_COLETTE).sort());
    expect(derniere("colette_accessoire")).toEqual(Object.keys(ACCESSOIRES_COLETTE).sort());
    expect(derniere("colette_motif")).toEqual(Object.keys(MOTIFS_COLETTE).sort());
  });
});
