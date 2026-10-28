import { describe, expect, it } from "vitest";
import { decouperMentions, extraireMentions } from "@/lib/social/mentions";
import { estNouveau, texteSerie } from "@/lib/social/revenir";

describe("@mentions dans les commentaires", () => {
  it("trouve les pseudos mentionnés, sans doublon, en minuscules", () => {
    expect(extraireMentions("Merci @sam.photo et @Lea_23 ! @sam.photo tu gères")).toEqual(["sam.photo", "lea_23"]);
  });
  it("ignore les emails et les pseudos impossibles", () => {
    expect(extraireMentions("écris à lea@gmail.com")).toEqual([]);
    expect(extraireMentions("@a @x")).toEqual([]);
  });
  it("ne garde pas le point final d'une phrase", () => {
    expect(extraireMentions("Demande à @tom.")).toEqual(["tom"]);
  });
  it("limite à 5 mentions par commentaire (anti-spam)", () => {
    expect(extraireMentions("@aaa @bbb @ccc @ddd @eee @fff @ggg")).toHaveLength(5);
  });
  it("découpe le texte pour afficher chaque mention en lien", () => {
    expect(decouperMentions("Bravo @sam.photo !")).toEqual([
      { texte: "Bravo " },
      { pseudo: "sam.photo" },
      { texte: " !" },
    ]);
    expect(decouperMentions("pas de mention")).toEqual([{ texte: "pas de mention" }]);
  });
});

describe("revenir sur le fil", () => {
  it("un post est nouveau s'il est arrivé depuis ma dernière visite", () => {
    expect(estNouveau("2026-10-28T10:00:00Z", "2026-10-27T10:00:00Z")).toBe(true);
    expect(estNouveau("2026-10-26T10:00:00Z", "2026-10-27T10:00:00Z")).toBe(false);
  });
  it("première visite ou date illisible : rien n'est marqué nouveau (pas de mur de pastilles)", () => {
    expect(estNouveau("2026-10-28T10:00:00Z", null)).toBe(false);
    expect(estNouveau("2026-10-28T10:00:00Z", "n'importe quoi")).toBe(false);
  });
  it("la série de semaines se dit en clair", () => {
    expect(texteSerie(0)).toBe("Pas encore de série : participe cette semaine pour la lancer");
    expect(texteSerie(1)).toBe("1 semaine d'affilée");
    expect(texteSerie(4)).toBe("4 semaines d'affilée");
  });
});

describe("la flamme « ça chauffe » sur les post-its qui font parler", () => {
  it("rien sans commentaire, une bulle de 1 à 2, la flamme dès 3", async () => {
    const { niveauDiscussion } = await import("@/lib/social/revenir");
    expect(niveauDiscussion(0)).toBe("aucune");
    expect(niveauDiscussion(2)).toBe("calme");
    expect(niveauDiscussion(3)).toBe("chaude");
  });
});
