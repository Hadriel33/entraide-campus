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
