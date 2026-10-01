import { describe, it, expect } from "vitest";
import { validerAnnonce } from "@/lib/annonces/validation";
import { dureeExpiration, joursRestants } from "@/lib/annonces/expiration";
import { normaliserRecherche } from "@/lib/annonces/recherche";
import { etapesAccueil } from "@/lib/profils/accueil";
import { DEFIS, defiDeLaSemaine } from "@/lib/gamification/defis";

const annonce = {
  type: "cherche",
  categorie: "coloc",
  titre: "Chambre près de Victor Hugo",
  description: "Tram A ou B, budget 550 euros, dès novembre.",
  contrepartie: "a_discuter",
  lieu: "",
  quartier: "victor_hugo",
  tram: "A",
};

describe("annonces : quartier et tram", () => {
  it("accepte un quartier et une ligne de tram connus", () => {
    const r = validerAnnonce(annonce);
    expect(r.ok).toBe(true);
    expect(r.valeurs?.quartier).toBe("victor_hugo");
    expect(r.valeurs?.tram).toBe("A");
  });
  it("les rend facultatifs (vide = null)", () => {
    const r = validerAnnonce({ ...annonce, quartier: "", tram: "" });
    expect(r.ok).toBe(true);
    expect(r.valeurs?.quartier).toBeNull();
    expect(r.valeurs?.tram).toBeNull();
  });
  it("refuse un quartier ou une ligne inconnus", () => {
    expect(validerAnnonce({ ...annonce, quartier: "paris" }).erreurs.quartier).toBeDefined();
    expect(validerAnnonce({ ...annonce, tram: "Z" }).erreurs.tram).toBeDefined();
  });
});

describe("expiration", () => {
  it("coloc et covoiturage expirent vite, les compétences durent plus longtemps", () => {
    expect(dureeExpiration("coloc")).toBe(14);
    expect(dureeExpiration("covoiturage")).toBe(14);
    expect(dureeExpiration("photo")).toBe(45);
  });
  it("calcule les jours restants, jamais négatifs", () => {
    const maintenant = new Date("2026-10-01T12:00:00Z");
    expect(joursRestants("2026-10-04T12:00:00Z", maintenant)).toBe(3);
    expect(joursRestants("2026-09-20T12:00:00Z", maintenant)).toBe(0);
  });
});

describe("recherche", () => {
  it("retire accents, ponctuation et mots trop courts", () => {
    expect(normaliserRecherche("  Événement, d'asso !! ")).toBe("evenement asso");
  });
  it("limite la longueur de la requête", () => {
    expect(normaliserRecherche("a".repeat(500)).length).toBeLessThanOrEqual(80);
  });
  it("renvoie une chaîne vide pour une recherche vide", () => {
    expect(normaliserRecherche("   ")).toBe("");
  });
});

describe("accueil guidé", () => {
  it("liste 4 étapes et calcule la progression", () => {
    const e = etapesAccueil({ avatar: false, competences: 0, coordonnees: false, annonces: 0 });
    expect(e.etapes).toHaveLength(4);
    expect(e.faites).toBe(0);
    expect(e.termine).toBe(false);
  });
  it("est terminé quand tout est fait", () => {
    const e = etapesAccueil({ avatar: true, competences: 3, coordonnees: true, annonces: 1 });
    expect(e.faites).toBe(4);
    expect(e.termine).toBe(true);
  });
});

describe("défi de la semaine", () => {
  it("change chaque semaine et tourne sur tous les défis", () => {
    const codes = new Set([0, 1, 2, 3].map((s) => defiDeLaSemaine(new Date(Date.UTC(2026, 9, 5 + s * 7))).code));
    expect(codes.size).toBe(DEFIS.length);
  });
  it("est le même toute la semaine (lundi et dimanche)", () => {
    expect(defiDeLaSemaine(new Date("2026-10-05T08:00:00Z")).code).toBe(defiDeLaSemaine(new Date("2026-10-11T20:00:00Z")).code);
  });
});

import { titresObtenus, titrePrincipal, SEUIL_TITRE } from "@/lib/gamification/titres";

describe("titres par spécialité", () => {
  it("un titre s'obtient en aidant 3 personnes différentes dans une catégorie", () => {
    expect(SEUIL_TITRE).toBe(3);
    expect(titresObtenus({ photo: 2 })).toEqual([]);
    expect(titresObtenus({ photo: 3 }).map((t) => t.titre)).toEqual(["Photographe du campus"]);
  });
  it("le titre principal est celui de la spécialité la plus aidée", () => {
    expect(titrePrincipal({ photo: 3, dev: 5 }, "Curieux")).toBe("Dev du campus");
  });
  it("sans titre de spécialité, on affiche le niveau", () => {
    expect(titrePrincipal({}, "Coup de main")).toBe("Coup de main");
  });
});
