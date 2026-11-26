// Retour de Hadriel (26/11) : on ne force pas la photo, une Colette personnalisée compte autant.
// Et le parcours d'arrivée s'enchaîne : chaque étape du profil mène à la suivante, la dernière au premier post-it.
import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { etapesAccueil, ETAPES_PROFIL, etapeSuivante, versAction } from "@/lib/profils/accueil";

const rien = { avatar: false, colette: false, competences: 0, coordonnees: false, annonces: 0 };

describe("première étape : ta tête, photo OU Colette", () => {
  it("une Colette personnalisée suffit, sans photo", () => {
    const e = etapesAccueil({ ...rien, colette: true });
    expect(e.etapes[0].fait).toBe(true);
    expect(e.faites).toBe(1);
  });
  it("une photo suffit aussi", () => {
    expect(etapesAccueil({ ...rien, avatar: true }).etapes[0].fait).toBe(true);
  });
  it("le libellé propose les deux, il n'impose pas la photo", () => {
    const t = etapesAccueil(rien).etapes[0];
    expect(t.titre).toMatch(/Colette/);
    expect(t.titre).toMatch(/photo/i);
    expect(t.lien).toBe("/compte#tete");
  });
});

describe("parcours d'arrivée : mêmes étapes partout, dans le même ordre", () => {
  it("le profil et la checklist suivent le même ordre", () => {
    const codes = etapesAccueil(rien).etapes.map((e) => e.code);
    expect(codes).toEqual(["tete", "competences", "coordonnees", "annonce"]);
    // Les sections du profil reprennent les trois premières, puis la classe (facultative).
    expect(ETAPES_PROFIL.map((e) => e.id)).toEqual(["tete", "competences", "coordonnees", "classe"]);
  });
  it("chaque section mène à la suivante, la dernière au premier post-it", () => {
    expect(etapeSuivante("tete")).toEqual({ href: "#competences", label: expect.stringMatching(/compétences/i) });
    expect(etapeSuivante("coordonnees")?.href).toBe("#classe");
    expect(etapeSuivante("classe")).toEqual({ href: "/annonces/nouvelle", label: expect.stringMatching(/premier post-it/i) });
    expect(etapeSuivante("inconnue")).toBeNull();
  });
});

describe("parcours : ce qui s'affiche est cohérent d'un écran à l'autre", () => {
  it("le bouton de la page Bienvenue garde « Colette » avec sa majuscule", () => {
    expect(versAction("Choisis ta tête : une photo ou ta Colette")).toBe("choisis ta tête : une photo ou ta Colette");
  });
  it("sans couleur choisie, la même Colette partout (menu, bureau, atelier) : celle tirée du pseudo", () => {
    const SRC = path.resolve(__dirname, "..");
    const fichiers = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? (e.name === "__tests__" ? [] : fichiers(path.join(d, e.name))) : e.name.endsWith(".tsx") ? [path.join(d, e.name)] : [],
      );
    const fautifs = fichiers(SRC).filter((f) => /couleur \|\| "jaune"|colette_couleur \|\| "jaune"/.test(readFileSync(f, "utf8")));
    expect(fautifs.map((f) => path.relative(SRC, f))).toEqual([]);
  });
});
