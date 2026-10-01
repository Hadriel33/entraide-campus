import { describe, expect, it } from "vitest";
import { grouperParAnnonce, resumeCandidat } from "@/lib/demandes/choix";

const A = { id: "a", titre: "Photos pour ton asso" };
const B = { id: "b", titre: "Coloc à Talence" };
const d = (id: string, annonce: typeof A | null, cree_le: string) => ({
  id,
  annonce,
  cree_le,
});

describe("choisir parmi les intéressés", () => {
  it("regroupe les demandes d'une même annonce dès 2 intéressés", () => {
    const { groupes, seules } = grouperParAnnonce([
      d("1", A, "2026-10-02"),
      d("2", B, "2026-10-01"),
      d("3", A, "2026-10-01"),
    ]);
    expect(groupes).toHaveLength(1);
    expect(groupes[0].annonce.id).toBe("a");
    expect(seules.map((x) => x.id)).toEqual(["2"]);
  });

  it("présente les intéressés du plus ancien au plus récent (personne n'est doublé), sans ordre imposé pour choisir", () => {
    const { groupes } = grouperParAnnonce([
      d("1", A, "2026-10-03"),
      d("2", A, "2026-10-01"),
      d("3", A, "2026-10-02"),
    ]);
    expect(groupes[0].demandes.map((x) => x.id)).toEqual(["2", "3", "1"]);
  });

  it("met en premier l'annonce qui a le plus d'intéressés", () => {
    const { groupes } = grouperParAnnonce([
      d("1", A, "1"),
      d("2", A, "2"),
      d("3", B, "1"),
      d("4", B, "2"),
      d("5", B, "3"),
    ]);
    expect(groupes.map((g) => g.annonce.id)).toEqual(["b", "a"]);
  });

  it("garde à part une demande dont l'annonce n'existe plus", () => {
    const { groupes, seules } = grouperParAnnonce([
      d("1", null, "1"),
      d("2", null, "2"),
    ]);
    expect(groupes).toHaveLength(0);
    expect(seules).toHaveLength(2);
  });

  it("résume un candidat avec des faits (aides, avis, badges)", () => {
    const r = resumeCandidat({
      annonces: 2,
      categories: 2,
      aides_donnees: 3,
      aides_recues: 0,
      croisements: 1,
      nb_avis: 3,
      note_moyenne: 4.7,
    });
    expect(r).toMatchObject({ aides: 3, avis: 3, note: 4.7 });
    expect(r.badges).toBeGreaterThanOrEqual(4);
    expect(resumeCandidat(null).niveau).toBe("Nouveau");
  });
});
