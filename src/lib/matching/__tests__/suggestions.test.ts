import { describe, it, expect } from "vitest";
import { suggerer, type AnnonceCandidate } from "../suggestions";

const base: AnnonceCandidate = {
  id: "1",
  type: "cherche",
  categorie: "photo",
  titre: "Cherche photographe",
  description: "Pour notre gala.",
};

describe("suggerer", () => {
  // Retour de test du 19/11 : Matthieu, 13 compétences marketing, et « Pour moi » presque vide.
  it("un mot fort d'une compétence suffit (« Landing Page Design » retrouve « Maquette d'une landing page »)", () => {
    const moi = { competences: ["Landing Page Design"], categoriesProposees: [], categoriesCherchees: [] };
    const a = { ...base, id: "lp", categorie: "ux_ui" as const, titre: "Maquette d'une landing page", description: "Je fournis les textes." };
    const s = suggerer(moi, [a]);
    expect(s).toHaveLength(1);
    expect(s[0].raison).toMatch(/Landing Page Design/);
  });
  it("une compétence relie à son domaine (SEO, Content Marketing : Rédaction et réseaux sociaux)", () => {
    const moi = { competences: ["SEO", "Content Marketing"], categoriesProposees: [], categoriesCherchees: [] };
    const a = { ...base, id: "red", categorie: "redaction" as const, titre: "Relecture de mon mémoire", description: "40 pages, orthographe et clarté." };
    const s = suggerer(moi, [a]);
    expect(s).toHaveLength(1);
    expect(s[0].raisons.join(" ")).toMatch(/Rédaction et réseaux sociaux/);
  });
  it("le profil de Matthieu trouve plusieurs post-its, la compétence exacte en premier", () => {
    const moi = {
      competences: ["Digital Marketing Strategy", "Google Ads", "Google Analytics", "SEO", "Content Marketing", "Landing Page Design", "Project Management", "vibe coding"],
      categoriesProposees: [],
      categoriesCherchees: [],
    };
    const annonces: AnnonceCandidate[] = [
      { ...base, id: "ga", categorie: "data_ia", titre: "Comprendre Google Analytics", description: "Analyser le trafic du site de mon alternance." },
      { ...base, id: "lp", categorie: "ux_ui", titre: "Maquette d'une landing page", description: "Une page simple pour présenter mon projet." },
      { ...base, id: "red", categorie: "redaction", titre: "Traduction anglaise de mon portfolio", description: "Une dizaine de pages." },
      { ...base, id: "covoit", categorie: "covoiturage", titre: "Covoit le jeudi soir", description: "Vers Talence." },
    ];
    const s = suggerer(moi, annonces, Infinity);
    expect(s.map((x) => x.annonce.id)).toEqual(["ga", "lp", "red"]);
  });

  it("ne propose pas deux fois le même titre (deux auteurs, même post-it)", () => {
    const moi = { competences: ["Python"], categoriesProposees: [], categoriesCherchees: [] };
    const a = { ...base, id: "a", categorie: "dev" as const, titre: "Aide Python pour mon mémoire", description: "Script Python." };
    const b = { ...a, id: "b", titre: "  aide python pour mon MÉMOIRE " };
    const c = { ...a, id: "c", titre: "Python pour un projet data" };
    const s = suggerer(moi, [a, b, c]);
    expect(s.map((x) => x.annonce.id)).toEqual(["a", "c"]);
  });

  it("propose une demande qui correspond à une catégorie où je propose déjà quelque chose", () => {
    const s = suggerer(
      {
        competences: [],
        categoriesProposees: ["photo"],
        categoriesCherchees: [],
      },
      [base],
    );
    expect(s).toHaveLength(1);
    expect(s[0].raison).toMatch(/photo/i);
  });

  it("propose une offre qui répond à ce que je cherche", () => {
    const offre = {
      ...base,
      id: "2",
      type: "propose" as const,
      categorie: "coloc" as const,
      titre: "Chambre libre",
      description: "Victor Hugo",
    };
    const s = suggerer(
      {
        competences: [],
        categoriesProposees: [],
        categoriesCherchees: ["coloc"],
      },
      [offre],
    );
    expect(s.map((x) => x.annonce.id)).toEqual(["2"]);
  });

  it("utilise mes compétences validées (issues du CV) pour trouver des demandes", () => {
    const a = {
      ...base,
      id: "3",
      categorie: "design" as const,
      titre: "Besoin d'aide sur Figma",
      description: "Maquette d'appli pour un projet.",
    };
    const s = suggerer(
      {
        competences: ["Figma", "Photoshop"],
        categoriesProposees: [],
        categoriesCherchees: [],
      },
      [a],
    );
    expect(s).toHaveLength(1);
    expect(s[0].raison).toMatch(/Figma/);
  });

  it("ignore les annonces sans rapport avec moi", () => {
    const a = {
      ...base,
      id: "4",
      categorie: "covoiturage" as const,
      titre: "Bordeaux vers Arcachon",
      description: "Vendredi soir.",
    };
    expect(
      suggerer(
        {
          competences: ["Photoshop"],
          categoriesProposees: ["photo"],
          categoriesCherchees: [],
        },
        [a],
      ),
    ).toEqual([]);
  });

  it("classe par pertinence et garde au maximum 3 suggestions", () => {
    const annonces: AnnonceCandidate[] = [
      { ...base, id: "a", titre: "Photo", description: "simple" },
      {
        ...base,
        id: "b",
        titre: "Photo et retouche Photoshop",
        description: "Photoshop indispensable",
      },
      { ...base, id: "c" },
      { ...base, id: "d" },
    ];
    const s = suggerer(
      {
        competences: ["Photoshop"],
        categoriesProposees: ["photo"],
        categoriesCherchees: [],
      },
      annonces,
    );
    expect(s).toHaveLength(3);
    expect(s[0].annonce.id).toBe("b");
  });

  it("ne confond pas une compétence avec un bout de mot (Java n'est pas JavaScript)", () => {
    const a = {
      ...base,
      id: "5",
      categorie: "dev" as const,
      titre: "Aide JavaScript",
      description: "Projet web.",
    };
    expect(
      suggerer(
        {
          competences: ["Java"],
          categoriesProposees: [],
          categoriesCherchees: [],
        },
        [a],
      ),
    ).toEqual([]);
  });
});

describe("tri « Pour moi »", () => {
  it("cumule les raisons et classe le meilleur match en premier", async () => {
    const { niveauMatch } = await import("../suggestions");
    const fort = {
      ...base,
      id: "5",
      categorie: "data_ia" as const,
      titre: "Aide Python pour mon mémoire",
      description: "Nettoyer des données.",
    };
    const faible = {
      ...base,
      id: "6",
      categorie: "photo" as const,
      titre: "Photos de gala",
      description: "Samedi.",
    };
    const s = suggerer(
      {
        competences: ["Python"],
        categoriesProposees: ["data_ia", "photo"],
        categoriesCherchees: [],
      },
      [faible, fort],
      Infinity,
    );
    expect(s.map((x) => x.annonce.id)).toEqual(["5", "6"]);
    expect(s[0].raisons).toHaveLength(2);
    expect(niveauMatch(s[0].score)).toBe("Très bon match");
    expect(niveauMatch(s[1].score)).toBe("Bon match");
  });
});
