import { describe, expect, it } from "vitest";
import { REACTIONS, resumerReactions, salonsDe, nomSalon } from "@/lib/social/social";

describe("réactions", () => {
  it("compte chaque réaction et dit si j'ai déjà réagi", () => {
    const r = resumerReactions(
      [
        { cible_id: "a", type: "bravo", auteur_id: "moi" },
        { cible_id: "a", type: "bravo", auteur_id: "lea" },
        { cible_id: "a", type: "feu", auteur_id: "lea" },
        { cible_id: "b", type: "merci", auteur_id: "tom" },
      ],
      "moi",
    );
    expect(r.get("a")?.bravo).toEqual({ n: 2, moi: true });
    expect(r.get("a")?.feu).toEqual({ n: 1, moi: false });
    expect(r.get("a")?.merci).toEqual({ n: 0, moi: false });
    expect(r.get("b")?.merci).toEqual({ n: 1, moi: false });
  });
  it("propose quatre réactions, toujours dans le même ordre", () => {
    expect(REACTIONS.map((x) => x.type)).toEqual(["bravo", "feu", "merci", "mdr"]);
  });
  it("ignore une réaction inconnue", () => {
    const r = resumerReactions([{ cible_id: "a", type: "pirate", auteur_id: "x" }], "moi");
    expect(r.get("a")).toBeDefined();
    expect(Object.keys(r.get("a")!)).toEqual(["bravo", "feu", "merci", "mdr"]);
  });
});

describe("salons", () => {
  it("le général et mon campus, plus ma classe si j'en ai une", () => {
    expect(salonsDe({ campus: "Bordeaux", classe: null }).map((s) => s.id)).toEqual(["general", "campus:Bordeaux"]);
    expect(salonsDe({ campus: "Lyon", classe: { id: "c1", nom: "B3 Créa" } })).toEqual([
      { id: "general", nom: "Général" },
      { id: "campus:Lyon", nom: "Campus de Lyon" },
      { id: "classe:c1", nom: "B3 Créa" },
    ]);
  });
  it("nomme un salon depuis son identifiant", () => {
    expect(nomSalon("general")).toBe("Général");
    expect(nomSalon("campus:Nantes")).toBe("Campus de Nantes");
    expect(nomSalon("classe:c1", "M1 Data")).toBe("M1 Data");
  });
});
