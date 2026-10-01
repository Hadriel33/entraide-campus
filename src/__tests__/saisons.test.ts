import { describe, expect, it } from "vitest";
import { saisonDu } from "@/lib/design/saisons";

describe("costumes de saison de Colette", () => {
  it("suit le calendrier du campus", () => {
    expect(saisonDu(new Date(2026, 8, 3))?.tenue).toBe("cartable");
    expect(saisonDu(new Date(2026, 9, 31))?.tenue).toBe("sorciere");
    expect(saisonDu(new Date(2026, 11, 17))?.tenue).toBe("cafe"); // le jour de la démo : partiels
    expect(saisonDu(new Date(2026, 11, 25))?.tenue).toBe("noel");
    expect(saisonDu(new Date(2027, 0, 2))?.tenue).toBe("bde");
    expect(saisonDu(new Date(2027, 6, 14))?.tenue).toBe("bde");
  });
  it("le reste de l'année, pas de costume", () => {
    expect(saisonDu(new Date(2026, 9, 1))).toBeNull();
    expect(saisonDu(new Date(2027, 2, 15))).toBeNull();
  });
});
