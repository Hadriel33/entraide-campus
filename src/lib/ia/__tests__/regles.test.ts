import { describe, it, expect } from "vitest";
import { deciderModeration, detecterCoordonnees, nettoyerCompetences } from "../regles";

describe("nettoyerCompetences", () => {
  it("retire les espaces, les vides et les doublons (sans tenir compte de la casse)", () => {
    expect(nettoyerCompetences(["  Photo ", "photo", "", "Retouche", "PHOTO"])).toEqual(["Photo", "Retouche"]);
  });
  it("écarte les compétences de plus de 40 caractères ou de moins de 2", () => {
    expect(nettoyerCompetences(["a", "x".repeat(41), "Montage vidéo"])).toEqual(["Montage vidéo"]);
  });
  it("garde au maximum 15 compétences", () => {
    expect(nettoyerCompetences(Array.from({ length: 30 }, (_, i) => `Compétence ${i}`))).toHaveLength(15);
  });
});

describe("detecterCoordonnees", () => {
  it("repère un numéro de téléphone français, avec ou sans espaces", () => {
    expect(detecterCoordonnees("Appelle-moi au 06 12 34 56 78")).toBe(true);
    expect(detecterCoordonnees("tel 0612345678")).toBe(true);
    expect(detecterCoordonnees("+33 6 12 34 56 78")).toBe(true);
  });
  it("repère une adresse email", () => {
    expect(detecterCoordonnees("écris à sam@exemple.fr")).toBe(true);
  });
  it("ne se déclenche pas sur un texte normal ou un prix", () => {
    expect(detecterCoordonnees("Cours de maths, 2 heures, 15 euros, tram A")).toBe(false);
    expect(detecterCoordonnees("Budget 550 euros, dès le 12/11")).toBe(false);
  });
});

describe("deciderModeration", () => {
  it("garde la décision de l'IA quand le texte est propre", () => {
    expect(deciderModeration({ statut: "ok", raisons: [] }, "Photos pour vos soirées")).toEqual({ statut: "ok", raisons: [] });
  });
  it("si l'IA est en panne, l'annonce reste en attente d'un humain", () => {
    expect(deciderModeration(null, "Photos pour vos soirées").statut).toBe("en_attente");
  });
  it("des coordonnées dans le texte forcent au moins « à vérifier », même si l'IA dit ok", () => {
    const d = deciderModeration({ statut: "ok", raisons: [] }, "Appelle-moi au 06 12 34 56 78");
    expect(d.statut).toBe("a_verifier");
    expect(d.raisons.join(" ")).toMatch(/coordonnées/i);
  });
  it("ne rétrograde jamais un refus probable", () => {
    expect(deciderModeration({ statut: "refus_probable", raisons: ["Arnaque"] }, "06 12 34 56 78").statut).toBe("refus_probable");
  });
  it("si l'IA est en panne et qu'il y a des coordonnées, on le signale quand même", () => {
    const d = deciderModeration(null, "sam@exemple.fr");
    expect(d.statut).toBe("a_verifier");
  });
  it("limite les raisons à 5 phrases courtes", () => {
    const d = deciderModeration({ statut: "a_verifier", raisons: Array.from({ length: 9 }, () => "x".repeat(300)) }, "texte");
    expect(d.raisons.length).toBeLessThanOrEqual(5);
    expect(d.raisons.every((r) => r.length <= 160)).toBe(true);
  });
});
