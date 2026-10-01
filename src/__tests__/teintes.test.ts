import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/annonces/validation";
import { TEINTE_CATEGORIE, inclinaison, teinte } from "@/lib/design/teintes";

describe("teintes de la charte", () => {
  it("chaque catégorie a une couleur", () => {
    for (const c of Object.keys(CATEGORIES)) expect(TEINTE_CATEGORIE).toHaveProperty(c);
  });
  it("l'inclinaison d'un post-it est stable et reste discrète", () => {
    const ids = ["a", "8f2c1e9a-1b2c-4d5e-9f00-123456789abc", "zz", ""];
    for (const id of ids) {
      expect(inclinaison(id)).toBe(inclinaison(id));
      expect(Math.abs(inclinaison(id))).toBeLessThanOrEqual(2.4);
    }
  });
  it("une catégorie inconnue retombe sur le jaune", () => {
    expect(teinte("inconnue").point).toBe("bg-bandeau");
  });
});
