import { describe, expect, it } from "vitest";
import { CATEGORIES, type Categorie } from "@/lib/annonces/validation";
import { graineDe, phrasesColette } from "@/lib/messages/brise-glace";

describe("les phrases de Colette pour lancer la discussion", () => {
  it("propose une phrase pratique, une sympa et une blague", () => {
    const p = phrasesColette({ categorie: "photo", jAide: true, prenom: "Léa" });
    expect(p.map((x) => x.ton)).toEqual(["pratique", "sympa", "blague"]);
    expect(p[0].texte).toContain("Léa");
  });

  it("adapte la phrase pratique selon qui aide", () => {
    const aidant = phrasesColette({ categorie: "dev", jAide: true, prenom: "Sam" })[0].texte;
    const aide = phrasesColette({ categorie: "dev", jAide: false, prenom: "Sam" })[0].texte;
    expect(aidant).toMatch(/Dis-m'en plus/);
    expect(aide).toMatch(/Merci d'avoir accepté/);
  });

  it("a une blague pour chaque catégorie, qui tient dans un message", () => {
    for (const c of Object.keys(CATEGORIES) as Categorie[]) {
      for (const graine of [0, 1, 2, 3]) {
        const blague = phrasesColette({ categorie: c, jAide: true, prenom: "X", graine })[2].texte;
        expect(blague.length).toBeGreaterThan(10);
        expect(blague.length).toBeLessThanOrEqual(1000);
      }
    }
  });

  it("varie d'une discussion à l'autre, mais reste stable pour la même", () => {
    expect(graineDe("abc")).toBe(graineDe("abc"));
    const blagues = new Set(["a", "b", "c", "d", "e", "f"].map((id) => phrasesColette({ categorie: "coloc", jAide: true, prenom: "X", graine: graineDe(id) })[2].texte));
    expect(blagues.size).toBeGreaterThan(1);
  });
});
