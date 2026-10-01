import { describe, it, expect } from "vitest";
import { validerAnnonce } from "../validation";

const valide = {
  type: "propose",
  categorie: "photo",
  titre: "Photos pour vos événements d'asso",
  description: "Soirées, galas, tournois. Retouche comprise, livraison sous 5 jours.",
  contrepartie: "gratuit",
  lieu: "Campus Victor Hugo",
};

describe("validerAnnonce", () => {
  it("accepte une annonce complète et renvoie les valeurs nettoyées", () => {
    const r = validerAnnonce({ ...valide, titre: "  Photos pour vos événements d'asso  " });
    expect(r.ok).toBe(true);
    expect(r.valeurs?.titre).toBe("Photos pour vos événements d'asso");
  });

  it("accepte un lieu vide (facultatif) et le transforme en null", () => {
    const r = validerAnnonce({ ...valide, lieu: "   " });
    expect(r.ok).toBe(true);
    expect(r.valeurs?.lieu).toBeNull();
  });

  it("refuse un type inconnu", () => {
    expect(validerAnnonce({ ...valide, type: "vend" }).erreurs.type).toBeDefined();
  });

  it("refuse une catégorie inconnue", () => {
    expect(validerAnnonce({ ...valide, categorie: "cuisine" }).erreurs.categorie).toBeDefined();
  });

  it("refuse un titre de moins de 5 caractères", () => {
    expect(validerAnnonce({ ...valide, titre: "Aide" }).erreurs.titre).toBeDefined();
  });

  it("refuse un titre de plus de 80 caractères", () => {
    expect(validerAnnonce({ ...valide, titre: "a".repeat(81) }).erreurs.titre).toBeDefined();
  });

  it("refuse une description de moins de 20 caractères", () => {
    expect(validerAnnonce({ ...valide, description: "Trop court" }).erreurs.description).toBeDefined();
  });

  it("refuse une description de plus de 1000 caractères", () => {
    expect(validerAnnonce({ ...valide, description: "a".repeat(1001) }).erreurs.description).toBeDefined();
  });

  it("refuse une contrepartie inconnue", () => {
    expect(validerAnnonce({ ...valide, contrepartie: "bitcoin" }).erreurs.contrepartie).toBeDefined();
  });

  it("refuse un lieu de plus de 80 caractères", () => {
    expect(validerAnnonce({ ...valide, lieu: "a".repeat(81) }).erreurs.lieu).toBeDefined();
  });

  it("ne renvoie pas de valeurs quand l'annonce est invalide", () => {
    const r = validerAnnonce({ ...valide, titre: "" });
    expect(r.ok).toBe(false);
    expect(r.valeurs).toBeUndefined();
  });
});
