import { describe, expect, it } from "vitest";
import { messageColette, type ContexteColette } from "@/lib/gamification/message-colette";

const base: ContexteColette = { classe: null, aUneClasse: true, rang: 0, ecartRang: 0, defi: null, phraseSaison: null, jour: 2 };

describe("ce que Colette dit sur le bureau", () => {
  it("parle d'abord de la classe", () => {
    expect(messageColette({ ...base, classe: { nom: "M1 Data", rang: 3, ecart: 4 } })).toBe("M1 Data est 3e des classes : encore 4 points pour passer 2e !");
    expect(messageColette({ ...base, classe: { nom: "M1 Data", rang: 1, ecart: 0 } })).toContain("en tête");
  });
  it("puis du rang personnel, puis de la classe à choisir", () => {
    expect(messageColette({ ...base, rang: 5, ecartRang: 1 })).toBe("Tu es 5e cette semaine, à 1 point de la 4e place.");
    expect(messageColette({ ...base, aUneClasse: false })).toContain("Choisis ta classe");
  });
  it("sinon le défi, la saison, puis une astuce du jour", () => {
    expect(messageColette({ ...base, defi: { titre: "Aide un étudiant de l'autre école", reussi: false } })).toContain("Défi de la semaine");
    expect(messageColette({ ...base, phraseSaison: "Partiels en vue." })).toBe("Partiels en vue.");
    expect(messageColette(base)).toMatch(/^Astuce/);
  });
});
