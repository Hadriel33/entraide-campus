import { describe, expect, it } from "vitest";
import { classerCampus, debutSaison } from "@/lib/gamification/campus";

// Le championnat des campus (retour du prof, 22/10) : même règle que les classes, la moyenne des membres
// actifs. Un petit campus qui s'entraide bien peut battre un gros campus.
describe("championnat des campus", () => {
  it("garde toujours les 6 campus, même à zéro", () => {
    const r = classerCampus([]);
    expect(r.map((c) => c.campus).sort()).toEqual(["Bordeaux", "Lille", "Lyon", "Nantes", "Paris", "Toulouse"]);
    expect(r.every((c) => c.score === 0)).toBe(true);
  });
  it("classe à la moyenne des membres actifs : un petit campus peut battre un gros", () => {
    const r = classerCampus([
      { campus: "Bordeaux", points: 10 },
      { campus: "Bordeaux", points: 10 },
      { campus: "Bordeaux", points: 10 },
      { campus: "Lyon", points: 40 },
    ]);
    expect(r[0]).toMatchObject({ campus: "Lyon", score: 40, actifs: 1 });
    expect(r[1]).toMatchObject({ campus: "Bordeaux", score: 10, total: 30, actifs: 3 });
  });
  it("les inscrits sans point ne font pas baisser la moyenne", () => {
    const r = classerCampus([
      { campus: "Paris", points: 20 },
      { campus: "Paris", points: 0 },
    ]);
    expect(r.find((c) => c.campus === "Paris")).toMatchObject({ score: 20, actifs: 1, membres: 2 });
  });
  it("ignore un campus inconnu", () => {
    const r = classerCampus([{ campus: "Mars", points: 99 }]);
    expect(r.some((c) => c.campus === ("Mars" as string))).toBe(false);
  });
  it("une saison dure un mois : elle commence le 1er du mois", () => {
    expect(debutSaison(new Date("2026-10-22T15:00:00Z"))).toBe("2026-10-01T00:00:00.000Z");
    expect(debutSaison(new Date("2026-11-01T00:30:00Z"))).toBe("2026-11-01T00:00:00.000Z");
  });
});
