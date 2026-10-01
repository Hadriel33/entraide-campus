import { describe, it, expect } from "vitest";
import { suggerer, type AnnonceCandidate } from "../suggestions";

const base: AnnonceCandidate = { id: "1", type: "cherche", categorie: "photo", titre: "Cherche photographe", description: "Pour notre gala." };

describe("suggerer", () => {
  it("propose une demande qui correspond à une catégorie où je propose déjà quelque chose", () => {
    const s = suggerer({ competences: [], categoriesProposees: ["photo"], categoriesCherchees: [] }, [base]);
    expect(s).toHaveLength(1);
    expect(s[0].raison).toMatch(/photo/i);
  });

  it("propose une offre qui répond à ce que je cherche", () => {
    const offre = { ...base, id: "2", type: "propose" as const, categorie: "coloc" as const, titre: "Chambre libre", description: "Victor Hugo" };
    const s = suggerer({ competences: [], categoriesProposees: [], categoriesCherchees: ["coloc"] }, [offre]);
    expect(s.map((x) => x.annonce.id)).toEqual(["2"]);
  });

  it("utilise mes compétences validées (issues du CV) pour trouver des demandes", () => {
    const a = { ...base, id: "3", categorie: "design" as const, titre: "Besoin d'aide sur Figma", description: "Maquette d'appli pour un projet." };
    const s = suggerer({ competences: ["Figma", "Photoshop"], categoriesProposees: [], categoriesCherchees: [] }, [a]);
    expect(s).toHaveLength(1);
    expect(s[0].raison).toMatch(/Figma/);
  });

  it("ignore les annonces sans rapport avec moi", () => {
    const a = { ...base, id: "4", categorie: "covoiturage" as const, titre: "Bordeaux vers Arcachon", description: "Vendredi soir." };
    expect(suggerer({ competences: ["Photoshop"], categoriesProposees: ["photo"], categoriesCherchees: [] }, [a])).toEqual([]);
  });

  it("classe par pertinence et garde au maximum 3 suggestions", () => {
    const annonces: AnnonceCandidate[] = [
      { ...base, id: "a", titre: "Photo", description: "simple" },
      { ...base, id: "b", titre: "Photo et retouche Photoshop", description: "Photoshop indispensable" },
      { ...base, id: "c" },
      { ...base, id: "d" },
    ];
    const s = suggerer({ competences: ["Photoshop"], categoriesProposees: ["photo"], categoriesCherchees: [] }, annonces);
    expect(s).toHaveLength(3);
    expect(s[0].annonce.id).toBe("b");
  });

  it("ne confond pas une compétence avec un bout de mot (Java n'est pas JavaScript)", () => {
    const a = { ...base, id: "5", categorie: "dev" as const, titre: "Aide JavaScript", description: "Projet web." };
    expect(suggerer({ competences: ["Java"], categoriesProposees: [], categoriesCherchees: [] }, [a])).toEqual([]);
  });
});
