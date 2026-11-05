import { describe, expect, it } from "vitest";
import { nouvellesPieces, piecesGagnees } from "@/lib/colette/recompenses";
import { GESTES, phraseReaction } from "@/lib/colette/reactions";
import { idsSurs } from "@/lib/annonces/arrivees";
import type { Stats } from "@/lib/gamification/progression";

const vide: Stats = { annonces: 0, categories: 0, aides_donnees: 0, aides_recues: 0, croisements: 0, nb_avis: 0, note_moyenne: null, aides_par_categorie: {}, defis_reussis: 0 };

describe("« Colette gagne une tenue »", () => {
  it("liste les pièces à gagner déjà gagnées (pas les pièces libres)", () => {
    const g = piecesGagnees({ ...vide, commentaires: 3, serie: 2 });
    expect(g.map((p) => p.code).sort()).toEqual(["accessoire:micro", "motif:etoiles"]);
    expect(g.find((p) => p.code === "accessoire:micro")?.aide).toBe("Écris 3 commentaires");
    expect(piecesGagnees(vide)).toEqual([]);
    expect(piecesGagnees(null)).toEqual([]);
  });
  it("première visite : rien n'est fêté (sinon tout tomberait d'un coup), on retient l'état", () => {
    expect(nouvellesPieces(["accessoire:micro"], null)).toEqual([]);
  });
  it("ensuite : seulement ce qui vient d'être gagné", () => {
    expect(nouvellesPieces(["accessoire:micro", "motif:etoiles"], ["accessoire:micro"])).toEqual(["motif:etoiles"]);
    expect(nouvellesPieces(["accessoire:micro"], ["accessoire:micro"])).toEqual([]);
  });
});

describe("Colette réagit à mes gestes", () => {
  it("a une phrase pour chaque geste, qui varie", () => {
    for (const g of GESTES) {
      expect(phraseReaction(g, 0).length).toBeGreaterThan(3);
      expect(phraseReaction(g, 0)).not.toBe(phraseReaction(g, 1));
    }
  });
  it("tourne sur ses phrases sans jamais planter", () => {
    expect(phraseReaction("soutien", 999)).toBeTruthy();
  });
});

describe("post-its arrivés en direct sur le tableau", () => {
  it("ne garde que des identifiants valides (ils finissent dans du CSS)", () => {
    expect(idsSurs(["8f2c1e9a-1b2c-4d5e-9f00-123456789abc", '"]{}body{display:none', 42])).toEqual(["8f2c1e9a-1b2c-4d5e-9f00-123456789abc"]);
  });
});
