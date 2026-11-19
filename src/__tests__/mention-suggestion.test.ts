import { describe, expect, it } from "vitest";
import { insererMention, mentionEnCours } from "@/lib/social/mentions";

describe("suggérer un pseudo quand on tape @", () => {
  it("repère le @ en cours de frappe juste avant le curseur", () => {
    expect(mentionEnCours("Merci @sa", 9)).toEqual({ debut: 6, prefixe: "sa" });
    expect(mentionEnCours("@", 1)).toEqual({ debut: 0, prefixe: "" });
    expect(mentionEnCours("Salut @lea.m", 12)).toEqual({ debut: 6, prefixe: "lea.m" });
  });
  it("ignore un email, un @ déjà fini (espace) ou un @ loin du curseur", () => {
    expect(mentionEnCours("ecris a lea@mail", 16)).toBeNull();
    expect(mentionEnCours("Merci @sam bravo", 16)).toBeNull();
    expect(mentionEnCours("Merci @sam bravo", 3)).toBeNull();
  });
  it("insère le pseudo choisi à la place du début tapé, suivi d'une espace", () => {
    expect(insererMention("Merci @sa", 6, 9, "sam.photo")).toEqual({ texte: "Merci @sam.photo ", curseur: 17 });
    expect(insererMention("@le et toi", 0, 3, "lea")).toEqual({ texte: "@lea  et toi", curseur: 5 });
  });
});
