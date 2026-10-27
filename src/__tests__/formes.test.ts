import { describe, expect, it } from "vitest";
import { CATEGORIES, type Categorie } from "@/lib/annonces/validation";
import { forme, FORMES } from "@/lib/design/formes";

// Retour du prof (22/10) : une forme de post-it par type d'annonce. Les cours et compétences restent
// le post-it classique ; le reste se reconnaît au premier coup d'œil, avant même de lire.
describe("formes des post-it", () => {
  it("chaque catégorie a une forme connue", () => {
    for (const c of Object.keys(CATEGORIES) as Categorie[]) expect(FORMES).toContain(forme(c));
  });
  it("les cours et compétences restent le post-it classique", () => {
    for (const c of ["photo", "video", "design", "ux_ui", "dev", "data_ia", "redaction", "coup_de_main"] as Categorie[]) {
      expect(forme(c)).toBe("classique");
    }
  });
  it("le covoit est un billet, la coloc une petite annonce à languettes, le matériel une étiquette", () => {
    expect(forme("covoiturage")).toBe("billet");
    expect(forme("coloc")).toBe("languettes");
    expect(forme("materiel")).toBe("etiquette");
  });
  it("le shooting est un polaroid, le binôme deux post-it l'un sur l'autre", () => {
    expect(forme("shooting")).toBe("polaroid");
    expect(forme("binome")).toBe("duo");
  });
  it("une catégorie inconnue retombe sur le classique", () => {
    expect(forme("inconnue")).toBe("classique");
  });
});
