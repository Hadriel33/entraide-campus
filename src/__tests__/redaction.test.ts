import { describe, expect, it } from "vitest";
import { nettoyerBrouillon } from "@/lib/ia/regles";

const base = { type: "propose", categorie: "photo", titre: "Photos de soirées étudiantes", description: "Je fais des photos de vos soirées et je les retouche.", contrepartie: "gratuit", quartier: null, tram: null };

describe("Colette rédactrice : le brouillon de l'IA est vérifié avant d'être proposé", () => {
  it("garde un brouillon valide, en texte pour le formulaire", () => {
    expect(nettoyerBrouillon(base)).toMatchObject({ type: "propose", categorie: "photo", titre: "Photos de soirées étudiantes", contrepartie: "gratuit", quartier: "", tram: "" });
  });
  it("retire les coordonnées que l'IA aurait recopiées", () => {
    const b = nettoyerBrouillon({ ...base, description: "Je fais des photos, appelle-moi au 06 12 34 56 78." });
    expect(b?.description).not.toMatch(/06 12/);
  });
  it("remplace une valeur hors liste par une valeur sûre et coupe les textes trop longs", () => {
    const b = nettoyerBrouillon({ ...base, categorie: "astrologie", contrepartie: "bitcoin", quartier: "lune", tram: "Z", titre: "x".repeat(200) });
    expect(b).toMatchObject({ categorie: "coup_de_main", contrepartie: "a_discuter", quartier: "", tram: "" });
    expect(b!.titre.length).toBeLessThanOrEqual(80);
  });
  it("rien d'exploitable : null (l'étudiant remplit à la main)", () => {
    expect(nettoyerBrouillon(null)).toBeNull();
    expect(nettoyerBrouillon({ ...base, titre: "", description: "" })).toBeNull();
  });
});
