import { describe, it, expect } from "vitest";
import { calculerProgression, type Stats } from "../progression";

const zero: Stats = { annonces: 0, categories: 0, aides_donnees: 0, aides_recues: 0, croisements: 0, nb_avis: 0, note_moyenne: null };

describe("calculerProgression", () => {
  it("un nouveau compte a 0 point, le niveau Nouveau et aucun badge", () => {
    const p = calculerProgression(zero);
    expect(p.points).toBe(0);
    expect(p.niveau.nom).toBe("Nouveau");
    expect(p.badges.filter((b) => b.obtenu)).toHaveLength(0);
  });

  it("une aide donnée rapporte plus qu'une aide reçue", () => {
    const donne = calculerProgression({ ...zero, aides_donnees: 1 }).points;
    const recu = calculerProgression({ ...zero, aides_recues: 1 }).points;
    expect(donne).toBeGreaterThan(recu);
  });

  it("les annonces publiées rapportent des points plafonnés (anti-spam)", () => {
    const dix = calculerProgression({ ...zero, annonces: 10 }).points;
    const cent = calculerProgression({ ...zero, annonces: 100 }).points;
    expect(cent).toBe(dix);
  });

  it("le niveau monte avec les points et la progression reste entre 0 et 100", () => {
    const p = calculerProgression({ ...zero, aides_donnees: 4, annonces: 2 });
    expect(p.niveau.nom).not.toBe("Nouveau");
    expect(p.progression).toBeGreaterThanOrEqual(0);
    expect(p.progression).toBeLessThanOrEqual(100);
  });

  it("au niveau maximum, il n'y a plus de niveau suivant et la progression vaut 100", () => {
    const p = calculerProgression({ ...zero, aides_donnees: 100 });
    expect(p.suivant).toBeNull();
    expect(p.progression).toBe(100);
  });

  it("attribue les badges selon les faits", () => {
    const p = calculerProgression({ ...zero, annonces: 1, aides_donnees: 1, croisements: 1, categories: 3 });
    const obtenus = p.badges.filter((b) => b.obtenu).map((b) => b.code);
    expect(obtenus).toEqual(expect.arrayContaining(["premiere_annonce", "premier_coup_de_main", "croisement", "polyvalent"]));
    expect(obtenus).not.toContain("pilier");
  });

  it("le badge Bien noté exige au moins 3 avis et une moyenne de 4,5", () => {
    const deuxAvis = calculerProgression({ ...zero, nb_avis: 2, note_moyenne: 5 });
    const ok = calculerProgression({ ...zero, nb_avis: 3, note_moyenne: 4.6 });
    const bas = calculerProgression({ ...zero, nb_avis: 5, note_moyenne: 4.2 });
    const a = (p: ReturnType<typeof calculerProgression>) => p.badges.find((b) => b.code === "bien_note")?.obtenu;
    expect(a(deuxAvis)).toBe(false);
    expect(a(ok)).toBe(true);
    expect(a(bas)).toBe(false);
  });
});
