import { describe, it, expect } from "vitest";
import { CAMPUS, ecoleDepuisEmail, validerConnexion, validerInscription } from "../validation";

const inscriptionValide = {
  email: "sam.riviere@mail-esp.com",
  motDePasse: "photo2026!",
  prenom: "Sam",
  pseudo: "sam.photo",
  campus: "Bordeaux",
};

describe("ecoleDepuisEmail", () => {
  it("reconnaît les emails de l'ESD et de l'ESP", () => {
    expect(ecoleDepuisEmail("hadriel.die@mail-esd.com")).toBe("ESD");
    expect(ecoleDepuisEmail("lea.martin@mail-esp.com")).toBe("ESP");
  });
  it("ignore les majuscules et les espaces autour", () => {
    expect(ecoleDepuisEmail("  Hadriel.Die@MAIL-ESD.com ")).toBe("ESD");
  });
  it("refuse les autres adresses", () => {
    expect(ecoleDepuisEmail("hadrieldie@yahoo.fr")).toBeNull();
    expect(ecoleDepuisEmail("sam@gmail.com")).toBeNull();
  });
  it("refuse les adresses qui imitent le domaine de l'école", () => {
    expect(ecoleDepuisEmail("pirate@mail-esd.com.evil.fr")).toBeNull();
    expect(ecoleDepuisEmail("pirate@evilmail-esd.com")).toBeNull();
    expect(ecoleDepuisEmail("pirate@sous.mail-esd.com")).toBeNull();
    expect(ecoleDepuisEmail("mail-esd.com")).toBeNull();
  });
});

describe("validerInscription", () => {
  it("accepte une inscription complète avec un email de l'école", () => {
    expect(validerInscription(inscriptionValide)).toEqual({ ok: true, erreurs: {}, ecole: "ESP", campus: "Bordeaux" });
  });

  it("refuse un email qui n'est pas celui de l'école", () => {
    const r = validerInscription({ ...inscriptionValide, email: "sam@gmail.com" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.email).toMatch(/mail-esd\.com|mail-esp\.com/);
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

  it("refuse un pseudo invalide", () => {
    const r = validerInscription({ ...inscriptionValide, pseudo: "sam photo" });
    expect(r.ok).toBe(false);
    expect(r.erreurs.pseudo).toBeDefined();
  });

  it("normalise le pseudo (arobase, majuscules)", () => {
    expect(validerInscription({ ...inscriptionValide, pseudo: "@Sam.Photo" }).ok).toBe(true);
  });
});

describe("validerConnexion", () => {
  it("accepte un email et un mot de passe renseignés", () => {
    expect(validerConnexion({ email: "lea@mail-esd.com", motDePasse: "x" }).ok).toBe(true);
  });

  it("refuse un mot de passe vide", () => {
    expect(validerConnexion({ email: "lea@mail-esd.com", motDePasse: "" }).erreurs.motDePasse).toBeDefined();
  });
});

// Retour du prof (22/10) : l'ESD rejoint l'ESP, on choisit son campus parmi les 6 campus ESP.
describe("campus à l'inscription", () => {
  it("propose les 6 campus de l'ESP", () => {
    expect([...CAMPUS]).toEqual(["Paris", "Lyon", "Bordeaux", "Toulouse", "Nantes", "Lille"]);
  });
  it("renvoie le campus choisi", () => {
    expect(validerInscription({ ...inscriptionValide, campus: "Lyon" }).campus).toBe("Lyon");
  });
  it("accepte encore les deux adresses, ESD et ESP", () => {
    expect(validerInscription({ ...inscriptionValide, email: "lea@mail-esd.com" }).ok).toBe(true);
    expect(validerInscription({ ...inscriptionValide, email: "lea@mail-esp.com" }).ok).toBe(true);
  });
  it("refuse un campus vide ou inconnu", () => {
    expect(validerInscription({ ...inscriptionValide, campus: "" }).erreurs.campus).toBeTruthy();
    expect(validerInscription({ ...inscriptionValide, campus: "Mars" }).erreurs.campus).toBeTruthy();
  });
});
