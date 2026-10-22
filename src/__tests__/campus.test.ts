import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Retour du prof (22/10) : l'ESD rejoint l'ESP. On n'oppose plus les deux écoles à l'écran : on parle de campus.
// Seules exceptions : les adresses email (les deux domaines existent encore) et la mention légale.
const AUTORISES = [
  "lib/auth/validation.ts", // les deux domaines d'email acceptés
  "app/(auth)/inscription/formulaire.tsx", // « ou ton ancienne adresse @mail-esd.com »
  "app/confidentialite/page.tsx", // mention légale : projet réalisé à l'ESD Bordeaux
];

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = path.join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === "__tests__" ? [] : fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

describe("campus plutôt qu'écoles", () => {
  it("n'affiche plus ESD ni « ESD contre ESP » (sauf emails et mentions légales)", () => {
    const racine = path.resolve(__dirname, "..");
    const fautes: string[] = [];
    for (const f of fichiers(racine)) {
      const relatif = path.relative(racine, f).split(path.sep).join("/");
      if (AUTORISES.includes(relatif)) continue;
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          if (/\bESD\b|BadgeEcole/.test(ligne)) fautes.push(`${relatif}:${i + 1}`);
        });
    }
    expect(fautes).toEqual([]);
  });
});
