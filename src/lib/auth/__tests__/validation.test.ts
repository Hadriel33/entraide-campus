import { describe, it, expect } from "vitest";
import { validerConnexion, validerInscription } from "../validation";

const inscriptionValide = {
  email: "sam@exemple.fr",
  motDePasse: "photo2026!",
  prenom: "Sam",
  ecole: "ESD",
  pseudo: "sam.photo",
};

describe("validerInscription", () => {
  it("accepte une inscription complète", () => {
    expect(validerInscription(inscriptionValide)).toEqual({ ok: true, erreurs: {} });
  });

  it("refuse une adresse sans arobase", () => {
    const r = validerInscription({ ...inscriptionValide, email: "sam.exemple.fr" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.email).toBeDefined();
  });

  it("refuse un mot de passe de moins de 8 caractères", () => {
    const r = validerInscription({ ...inscriptionValide, motDePasse: "court" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.motDePasse).toBeDefined();
  });

  it("refuse un prénom vide ou fait d'espaces", () => {
    const r = validerInscription({ ...inscriptionValide, prenom: "   " });
    expect(r.ok).toBe(false);
    expect(r.erreurs.prenom).toBeDefined();
  });

  it("refuse un prénom de plus de 40 caractères", () => {
    const r = validerInscription({ ...inscriptionValide, prenom: "a".repeat(41) });
    expect(r.erreurs.prenom).toBeDefined();
  });

  it("refuse une école autre que ESD ou ESP", () => {
    const r = validerInscription({ ...inscriptionValide, ecole: "HEC" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.ecole).toBeDefined();
  });

  it("refuse un pseudo invalide", () => {
    const r = validerInscription({ ...inscriptionValide, pseudo: "sam photo" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.pseudo).toBeDefined();
  });

  it("normalise le pseudo (arobase, majuscules)", () => {
    expect(validerInscription({ ...inscriptionValide, pseudo: "@Sam.Photo" }).ok).toBe(true);
  });

  it("ignore les espaces autour de l'email", () => {
    expect(validerInscription({ ...inscriptionValide, email: "  sam@exemple.fr " }).ok).toBe(true);
  });
});

describe("validerConnexion", () => {
  it("accepte un email et un mot de passe renseignés", () => {
    expect(validerConnexion({ email: "lea@exemple.fr", motDePasse: "x" }).ok).toBe(true);
  });

  it("refuse un mot de passe vide", () => {
    expect(validerConnexion({ email: "lea@exemple.fr", motDePasse: "" }).erreurs.motDePasse).toBeDefined();
  });
});
