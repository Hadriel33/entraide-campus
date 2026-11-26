// Boîte à suggestions (26/11) : un retour libre vers l'équipe. Même règles que la base (migration 0038).
import { describe, expect, it } from "vitest";
import { CATEGORIES_SUGGESTION, validerSuggestion } from "@/lib/suggestions/validation";

describe("boîte à suggestions", () => {
  it("accepte une idée, nettoie les espaces", () => {
    expect(validerSuggestion({ categorie: "idee", texte: "  Un mode sombre pour la carte, ce serait top.  " })).toEqual({
      ok: true,
      valeurs: { categorie: "idee", texte: "Un mode sombre pour la carte, ce serait top." },
    });
  });
  it("propose trois sortes de retour", () => {
    expect(Object.keys(CATEGORIES_SUGGESTION)).toEqual(["idee", "bug", "autre"]);
  });
  it("refuse un texte trop court ou trop long, et une catégorie inventée", () => {
    expect(validerSuggestion({ categorie: "idee", texte: "ok" }).ok).toBe(false);
    expect(validerSuggestion({ categorie: "idee", texte: "x".repeat(1001) }).ok).toBe(false);
    expect(validerSuggestion({ categorie: "pub", texte: "Un texte assez long pour passer." }).ok).toBe(false);
  });
  it("dit pourquoi c'est refusé", () => {
    const r = validerSuggestion({ categorie: "bug", texte: "court" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreur).toMatch(/10 caractères/);
  });
});
