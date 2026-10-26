import { describe, expect, it } from "vitest";
import { CAMPUS } from "@/lib/auth/validation";
import { QUARTIERS } from "@/lib/annonces/validation";
import { CARTES, pointDuQuartier, quartiersDu, versPourcent, tuiles } from "@/lib/carte/mercator";

// Retour du prof (22/10) : la carte autour de CHAQUE campus ESP, pas seulement Bordeaux.
describe("une carte par campus", () => {
  it("chaque campus a sa carte, son point campus et au moins 8 quartiers", () => {
    for (const c of CAMPUS) {
      const carte = CARTES[c];
      expect(carte).toBeDefined();
      expect(quartiersDu(c)).toContain(carte.campus);
      expect(quartiersDu(c).length).toBeGreaterThanOrEqual(8);
    }
  });
  it("chaque quartier est dans le cadre de son campus", () => {
    for (const c of CAMPUS) {
      const carte = CARTES[c];
      for (const q of quartiersDu(c)) {
        const [lat, lng] = pointDuQuartier(q)!;
        const p = versPourcent(lat, lng, carte.cadre);
        expect(p.gauche, `${c} ${q}`).toBeGreaterThan(2);
        expect(p.gauche, `${c} ${q}`).toBeLessThan(98);
        expect(p.haut, `${c} ${q}`).toBeGreaterThan(2);
        expect(p.haut, `${c} ${q}`).toBeLessThan(98);
      }
    }
  });
  it("un quartier n'appartient qu'à un campus, et chacun a son nom affiché", () => {
    const vus = new Set<string>();
    for (const c of CAMPUS) {
      for (const q of quartiersDu(c)) {
        expect(vus.has(q), q).toBe(false);
        vus.add(q);
        expect(QUARTIERS[q as keyof typeof QUARTIERS], q).toBeTruthy();
      }
    }
    // Plus « Ailleurs », commun à tous les campus.
    expect(Object.keys(QUARTIERS).sort()).toEqual([...vus, "hors_bordeaux"].sort());
  });
  // Leçon du parcours Playwright (02/10) : deux punaises trop proches, et l'une devient impossible à cliquer.
  it("deux punaises d'une même carte ne se chevauchent pas", () => {
    for (const c of CAMPUS) {
      const carte = CARTES[c];
      const points = quartiersDu(c).map((q) => ({ q, ...versPourcent(...pointDuQuartier(q)!, carte.cadre) }));
      for (const a of points)
        for (const b of points) {
          if (a.q >= b.q) continue;
          const ecart = Math.hypot(a.gauche - b.gauche, (a.haut - b.haut) * 0.7);
          expect(ecart, `${c} : ${a.q} et ${b.q}`).toBeGreaterThan(3.5);
        }
    }
  });
  it("chaque carte tient en moins de 40 tuiles", () => {
    for (const c of CAMPUS) expect(tuiles(CARTES[c].cadre).length).toBeLessThan(40);
  });
  it("Bordeaux garde ses quartiers et son campus Victor Hugo", () => {
    expect(CARTES.Bordeaux.campus).toBe("victor_hugo");
    expect(quartiersDu("Bordeaux")).toContain("begles");
  });
});
