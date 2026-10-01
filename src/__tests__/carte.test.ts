import { describe, expect, it } from "vitest";
import { CADRE_BORDEAUX, GPS_QUARTIERS, tuiles, versPourcent } from "@/lib/carte/mercator";

describe("carte réelle de Bordeaux", () => {
  it("les coins du cadre tombent à 0 % et 100 %", () => {
    const hg = versPourcent(CADRE_BORDEAUX.nord, CADRE_BORDEAUX.ouest);
    const bd = versPourcent(CADRE_BORDEAUX.sud, CADRE_BORDEAUX.est);
    expect(hg.gauche).toBeCloseTo(0);
    expect(hg.haut).toBeCloseTo(0);
    expect(bd.gauche).toBeCloseTo(100);
    expect(bd.haut).toBeCloseTo(100);
  });
  it("chaque quartier est dans le cadre, la Bastide à l'est du centre, Mérignac à l'ouest", () => {
    for (const [lat, lng] of Object.values(GPS_QUARTIERS)) {
      const p = versPourcent(lat, lng);
      expect(p.gauche).toBeGreaterThan(0);
      expect(p.gauche).toBeLessThan(100);
      expect(p.haut).toBeGreaterThan(0);
      expect(p.haut).toBeLessThan(100);
    }
    const centre = versPourcent(...GPS_QUARTIERS.centre);
    expect(versPourcent(...GPS_QUARTIERS.bastide).gauche).toBeGreaterThan(centre.gauche);
    expect(versPourcent(...GPS_QUARTIERS.merignac).gauche).toBeLessThan(centre.gauche);
    expect(versPourcent(...GPS_QUARTIERS.bacalan).haut).toBeLessThan(centre.haut);
  });
  it("les tuiles couvrent tout le cadre", () => {
    const t = tuiles();
    expect(Math.min(...t.map((x) => x.gauche))).toBeLessThanOrEqual(0);
    expect(Math.max(...t.map((x) => x.gauche + x.largeur))).toBeGreaterThanOrEqual(100);
    expect(t.length).toBeLessThan(40);
  });
});
