import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

// Garde-fou contre toute la famille du bug du 02/10 (tableau, liste et détail des annonces vides) :
// entre annonces, demandes, avis, signalements et profils, il existe plusieurs chemins (auteur, favoris,
// demandeur, destinataire...). Une jointure « profils(...) » sans nom de lien est refusée par Supabase, et la
// page s'affiche vide sans erreur visible. Toute jointure vers profils doit donc nommer sa clé étrangère.

function fichiers(dossier: string): string[] {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = path.join(dossier, nom);
    if (statSync(chemin).isDirectory()) return nom === "__tests__" ? [] : fichiers(chemin);
    return /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
  });
}

describe("jointures Supabase", () => {
  it("nomment toujours le lien vers profils (sinon : requête refusée, page vide)", () => {
    const fautes: string[] = [];
    for (const f of fichiers(path.resolve(__dirname, ".."))) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          // « profils(...) » ou « profils!inner(...) » sans nom de clé étrangère
          if (/[:\s,(`"]profils(!inner)?\(/.test(ligne)) fautes.push(`${path.relative(process.cwd(), f)}:${i + 1}`);
        });
    }
    expect(fautes).toEqual([]);
  });
});
