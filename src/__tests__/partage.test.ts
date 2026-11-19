import { describe, expect, it } from "vitest";
import { SALONS_THEMES, nomSalon, tousLesSalons } from "@/lib/social/social";
import { validerPartage } from "@/lib/social/partage";

const uuid = "8f2c1e9a-1b2c-4d5e-9f00-123456789abc";

describe("salons par thème (les « channels »)", () => {
  it("5 thèmes ouverts à tous, avec un nom clair", () => {
    expect(SALONS_THEMES.map((s) => s.id)).toEqual(["theme:photo-video", "theme:dev", "theme:design", "theme:data-ia", "theme:logement"]);
    expect(nomSalon("theme:logement")).toBe("Coloc et covoit");
  });
  it("chacun voit le général, son campus, sa classe, puis les thèmes", () => {
    const s = tousLesSalons({ campus: "Lyon", classe: null }).map((x) => x.id);
    expect(s.slice(0, 2)).toEqual(["general", "campus:Lyon"]);
    expect(s).toContain("theme:dev");
  });
});

describe("partager un post-it dans un salon ou une discussion", () => {
  it("accepte un salon connu ou une discussion, et un petit mot facultatif", () => {
    expect(validerPartage({ annonce: uuid, destination: "salon:theme:dev", mot: "  Ça te dit ?  " })).toEqual({ annonce: uuid, type: "salon", cible: "theme:dev", mot: "Ça te dit ?" });
    expect(validerPartage({ annonce: uuid, destination: `discussion:${uuid}`, mot: "" })).toEqual({ annonce: uuid, type: "discussion", cible: uuid, mot: "" });
    expect(validerPartage({ annonce: uuid, destination: "salon:campus:Lille", mot: "" })?.cible).toBe("campus:Lille");
  });
  it("refuse une destination inventée, un post-it invalide ou un mot trop long", () => {
    expect(validerPartage({ annonce: uuid, destination: "salon:theme:pirate", mot: "" })).toBeNull();
    expect(validerPartage({ annonce: uuid, destination: "discussion:pas-un-id", mot: "" })).toBeNull();
    expect(validerPartage({ annonce: "x", destination: "salon:general", mot: "" })).toBeNull();
    expect(validerPartage({ annonce: uuid, destination: "salon:general", mot: "a".repeat(301) })).toBeNull();
  });
});
