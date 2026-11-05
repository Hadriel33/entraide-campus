import { describe, expect, it } from "vitest";
import { MOTIFS_SIGNALEMENT, validerSignalementMessage } from "@/lib/social/signalement";

const id = "8f2c1e9a-1b2c-4d5e-9f00-123456789abc";

describe("signaler un commentaire ou un message de salon", () => {
  it("accepte un commentaire ou un message de salon, avec un motif de la liste", () => {
    expect(validerSignalementMessage({ cible: "commentaire", id, motif: "harcelement" })).toEqual({ cible: "commentaire", id, motif: "harcelement" });
    expect(validerSignalementMessage({ cible: "salon", id, motif: "coordonnees" })).toEqual({ cible: "salon", id, motif: "coordonnees" });
  });
  it("refuse une cible, un identifiant ou un motif inventés", () => {
    expect(validerSignalementMessage({ cible: "annonce", id, motif: "autre" })).toBeNull();
    expect(validerSignalementMessage({ cible: "salon", id: "1 or 1=1", motif: "autre" })).toBeNull();
    expect(validerSignalementMessage({ cible: "salon", id, motif: "<script>" })).toBeNull();
  });
  it("chaque motif a un libellé clair (mêmes motifs que la base)", () => {
    expect(Object.keys(MOTIFS_SIGNALEMENT)).toEqual(["harcelement", "inapproprie", "coordonnees", "arnaque", "autre"]);
    for (const l of Object.values(MOTIFS_SIGNALEMENT)) expect(l.length).toBeGreaterThan(4);
  });
});
