import { describe, expect, it } from "vitest";
import { ACCESSOIRES_COLETTE, MOTIFS_COLETTE, estDebloque, validerClasse, validerColette, validerNomClasse } from "@/lib/profils/colette";
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
