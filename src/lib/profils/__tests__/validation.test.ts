import { describe, it, expect } from "vitest";
import { normaliserPseudo, validerAvatar, validerAvis, validerCoordonnees, validerPseudo } from "../validation";

describe("validerPseudo", () => {
  it("accepte lettres minuscules, chiffres, point et tiret bas", () => {
    expect(validerPseudo("sam.photo_33")).toBeUndefined();
  });
  it("refuse moins de 3 ou plus de 20 caractères", () => {
    expect(validerPseudo("ab")).toBeDefined();
    expect(validerPseudo("a".repeat(21))).toBeDefined();
  });
  it("refuse les espaces, accents et majuscules non normalisées", () => {
    expect(validerPseudo("sam photo")).toBeDefined();
    expect(validerPseudo("léa")).toBeDefined();
    expect(validerPseudo("Sam")).toBeDefined();
  });
  it("refuse un point au début ou à la fin", () => {
    expect(validerPseudo(".sam")).toBeDefined();
    expect(validerPseudo("sam.")).toBeDefined();
  });
  it("normalise : minuscules, sans espaces autour, sans arobase", () => {
    expect(normaliserPseudo("  @Sam.Photo ")).toBe("sam.photo");
  });
});

describe("validerCoordonnees", () => {
  it("accepte un téléphone français et un email", () => {
    const r = validerCoordonnees({ telephone: "06 12 34 56 78", email: "sam@exemple.fr", reseau: "" });
    expect(r.ok).toBe(true);
    expect(r.valeurs?.telephone).toBe("0612345678");
    expect(r.valeurs?.reseau).toBeNull();
  });
  it("accepte le format international +33", () => {
    expect(validerCoordonnees({ telephone: "+33 6 12 34 56 78", email: "", reseau: "" }).ok).toBe(true);
  });
  it("refuse un téléphone invalide", () => {
    expect(validerCoordonnees({ telephone: "12345", email: "sam@exemple.fr", reseau: "" }).erreurs.telephone).toBeDefined();
  });
  it("refuse un email invalide", () => {
    expect(validerCoordonnees({ telephone: "", email: "sam.exemple.fr", reseau: "" }).erreurs.email).toBeDefined();
  });
  it("exige au moins un moyen de contact", () => {
    expect(validerCoordonnees({ telephone: "", email: "", reseau: "" }).ok).toBe(false);
  });
  it("refuse un réseau de plus de 60 caractères", () => {
    expect(validerCoordonnees({ telephone: "", email: "", reseau: "a".repeat(61) }).erreurs.reseau).toBeDefined();
  });
});

describe("validerAvis", () => {
  it("accepte une note de 1 à 5 avec un commentaire facultatif", () => {
    expect(validerAvis({ note: "5", commentaire: "" }).ok).toBe(true);
    expect(validerAvis({ note: "1", commentaire: "Pas venu au rendez-vous." }).ok).toBe(true);
  });
  it("refuse une note hors limites ou non entière", () => {
    expect(validerAvis({ note: "0", commentaire: "" }).ok).toBe(false);
    expect(validerAvis({ note: "6", commentaire: "" }).ok).toBe(false);
    expect(validerAvis({ note: "4.5", commentaire: "" }).ok).toBe(false);
  });
  it("refuse un commentaire de plus de 300 caractères", () => {
    expect(validerAvis({ note: "4", commentaire: "a".repeat(301) }).erreurs.commentaire).toBeDefined();
  });
});

describe("validerAvatar", () => {
  it("accepte un JPG, PNG ou WebP de 2 Mo maximum", () => {
    expect(validerAvatar({ type: "image/png", size: 500_000 })).toBeUndefined();
    expect(validerAvatar({ type: "image/webp", size: 2 * 1024 * 1024 })).toBeUndefined();
  });
  it("refuse un autre format", () => {
    expect(validerAvatar({ type: "image/svg+xml", size: 1000 })).toBeDefined();
    expect(validerAvatar({ type: "application/pdf", size: 1000 })).toBeDefined();
  });
  it("refuse un fichier trop lourd ou vide", () => {
    expect(validerAvatar({ type: "image/jpeg", size: 2 * 1024 * 1024 + 1 })).toBeDefined();
    expect(validerAvatar({ type: "image/jpeg", size: 0 })).toBeDefined();
  });
});
