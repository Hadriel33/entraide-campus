import { describe, expect, it } from "vitest";
import { IAS, iaNumero } from "@/lib/ia/presentation";

describe("les 4 IA de Colette, expliquées aux étudiants", () => {
  it("il y en a 4, numérotées 1 à 4 (CV, relecture, tri, rédaction)", () => {
    expect(IAS.map((i) => i.numero)).toEqual([1, 2, 3, 4]);
  });
  it("chacune dit à quoi elle sert, où la trouver, ce que tu décides et ce qu'elle ne fait jamais", () => {
    for (const ia of IAS) {
      expect(ia.nom.length).toBeGreaterThan(3);
      expect(ia.sertA.length).toBeGreaterThan(20);
      expect(ia.ou.href.startsWith("/")).toBe(true);
      expect(ia.tuDecides.length).toBeGreaterThan(10);
      expect(ia.jamais.length).toBeGreaterThan(10);
    }
  });
  it("le badge court de chaque IA tient sur une pastille", () => {
    for (const ia of IAS) expect(ia.badge.length).toBeLessThanOrEqual(22);
    expect(iaNumero(2).badge).toBe(IAS[1].badge);
  });
  it("ne parle jamais des écoles (retour du prof)", () => {
    expect(JSON.stringify(IAS)).not.toMatch(/ESD|ESP/);
  });
});
