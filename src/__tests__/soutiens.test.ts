import { describe, expect, it } from "vitest";
import { PALIERS_SOUTIEN, estPalierSoutien, resumerSoutiens, texteSoutiens } from "@/lib/social/soutiens";

describe("« Je soutiens » : faire monter un post-it", () => {
  it("compte les soutiens par post-it et dit si j'ai déjà soutenu", () => {
    const r = resumerSoutiens(
      [
        { annonce_id: "a", auteur_id: "moi" },
        { annonce_id: "a", auteur_id: "lea" },
        { annonce_id: "b", auteur_id: "tom" },
      ],
      "moi",
    );
    expect(r.get("a")).toEqual({ n: 2, moi: true });
    expect(r.get("b")).toEqual({ n: 1, moi: false });
    expect(r.get("c")).toBeUndefined();
  });
  it("l'auteur n'est prévenu qu'aux paliers (pas une notification par clic)", () => {
    expect(PALIERS_SOUTIEN).toEqual([1, 3, 5, 10, 20, 50]);
    expect(estPalierSoutien(1)).toBe(true);
    expect(estPalierSoutien(2)).toBe(false);
    expect(estPalierSoutien(10)).toBe(true);
    expect(estPalierSoutien(11)).toBe(false);
  });
  it("se dit en clair", () => {
    expect(texteSoutiens(0)).toBe("Sois le premier à soutenir");
    expect(texteSoutiens(1)).toBe("1 soutien");
    expect(texteSoutiens(7)).toBe("7 soutiens");
  });
});
