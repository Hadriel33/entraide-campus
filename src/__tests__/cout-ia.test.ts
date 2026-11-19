import { describe, expect, it } from "vitest";
import { budgetAtteint, coutEuros, PRIX_MODELES } from "@/lib/ia/cout";

describe("coût des IA", () => {
  it("calcule le coût d'un appel d'après les tokens et le tarif du modèle servi (en euros)", () => {
    // Gemini 2.5 Flash : 0,30 $ le million de tokens en entrée, 2,50 $ en sortie ; 1 $ = 0,92 €.
    expect(coutEuros({ modele: "google/gemini-2.5-flash", entree: 1_000_000, sortie: 0 })).toBeCloseTo(0.276, 5);
    expect(coutEuros({ modele: "google/gemini-2.5-flash", entree: 2000, sortie: 400 })).toBeCloseTo((2000 * 0.3 + 400 * 2.5) / 1e6 * 0.92, 8);
  });
  it("un modèle de secours a son propre tarif ; un modèle inconnu prend le tarif le plus cher (prudence)", () => {
    expect(coutEuros({ modele: "google/gemini-2.5-flash-lite", entree: 1_000_000, sortie: 0 })).toBeCloseTo(0.092, 5);
    const plusCher = Math.max(...Object.values(PRIX_MODELES).map((p) => p.sortie));
    expect(coutEuros({ modele: "inconnu/x", entree: 0, sortie: 1_000_000 })).toBeCloseTo(plusCher * 0.92, 5);
  });
  it("le plafond est atteint quand la dépense totale l'atteint ; un plafond à 0 coupe les IA", () => {
    expect(budgetAtteint(4.99, 5)).toBe(false);
    expect(budgetAtteint(5, 5)).toBe(true);
    expect(budgetAtteint(0, 0)).toBe(true);
  });
});
