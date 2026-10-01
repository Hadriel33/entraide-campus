import { describe, expect, it } from "vitest";
import { validerClasse, validerColette } from "@/lib/profils/colette";

describe("réglages de Colette et de la classe", () => {
  it("accepte un choix de la liste", () => {
    expect(validerColette({ couleur: "lilas", humeur: "fiere", accessoire: "photo" })).toEqual({
      colette_couleur: "lilas",
      colette_humeur: "fiere",
      colette_accessoire: "photo",
    });
  });
  it("refuse une valeur inventée", () => {
    expect(validerColette({ couleur: "fluo", humeur: "fiere", accessoire: "photo" })).toBeNull();
    expect(validerColette({ couleur: "jaune", humeur: "fiere", accessoire: "<script>" })).toBeNull();
  });
  it("classe : vide = aucune, uuid accepté, le reste refusé", () => {
    expect(validerClasse("")).toBeNull();
    expect(validerClasse("8f2c1e9a-1b2c-4d5e-9f00-123456789abc")).toBe("8f2c1e9a-1b2c-4d5e-9f00-123456789abc");
    expect(validerClasse("M1 Data")).toBe(false);
  });
});
