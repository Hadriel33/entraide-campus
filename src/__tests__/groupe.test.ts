import { describe, expect, it } from "vitest";
import { MAX_MEMBRES, equipeAcceptee, libelleEquipe, peutInviter, validerPseudoInvite } from "@/lib/annonces/groupe";

describe("post-its de groupe", () => {
  it("accepte un pseudo avec ou sans @, en minuscules", () => {
    expect(validerPseudoInvite("@Lea_23")).toBe("lea_23");
    expect(validerPseudoInvite("  sam.photo ")).toBe("sam.photo");
  });
  it("refuse ce qui n'est pas un pseudo", () => {
    expect(validerPseudoInvite("")).toBeNull();
    expect(validerPseudoInvite("@a")).toBeNull();
    expect(validerPseudoInvite("lea@gmail.com")).toBeNull();
    expect(validerPseudoInvite("<script>")).toBeNull();
  });
  it("4 personnes au plus : le créateur et 3 membres (invitations comprises)", () => {
    expect(MAX_MEMBRES).toBe(3);
    expect(peutInviter(2)).toBe(true);
    expect(peutInviter(3)).toBe(false);
  });
  it("seuls les membres qui ont accepté apparaissent sur le post-it", () => {
    const membres = [
      { statut: "accepte", membre: { pseudo: "lea" } },
      { statut: "invite", membre: { pseudo: "tom" } },
    ];
    expect(equipeAcceptee(membres).map((m) => m.pseudo)).toEqual(["lea"]);
    expect(equipeAcceptee(undefined)).toEqual([]);
  });
  it("dit l'équipe en clair", () => {
    expect(libelleEquipe("sam", [])).toBe("@sam");
    expect(libelleEquipe("sam", ["lea"])).toBe("@sam et @lea");
    expect(libelleEquipe("sam", ["lea", "tom"])).toBe("@sam et 2 potes");
  });
});
