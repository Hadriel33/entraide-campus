import { describe, expect, it } from "vitest";
import { CATEGORIES } from "@/lib/annonces/validation";
import { TEINTE_CATEGORIE, teinte } from "@/lib/design/teintes";

describe("teintes de la charte", () => {
  it("chaque catégorie a une couleur", () => {
    for (const c of Object.keys(CATEGORIES)) expect(TEINTE_CATEGORIE).toHaveProperty(c);
  });
  it("une catégorie inconnue retombe sur le jaune", () => {
    expect(teinte("inconnue").point).toBe("bg-bandeau");
  });
});
