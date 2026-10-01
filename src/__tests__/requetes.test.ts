import { describe, expect, it } from "vitest";
import { SELECT_ANNONCE } from "@/lib/annonces/requetes";

// Régression du 02/10 : depuis les favoris (migration 0013), il existe deux chemins entre annonces et profils
// (l'auteur, et les favoris). Une jointure « auteur:profils(...) » sans nom de lien est refusée par Supabase :
// le mur, la liste et le détail des annonces s'affichaient vides.
describe("requête des annonces", () => {
  it("nomme le lien vers l'auteur", () => {
    expect(SELECT_ANNONCE).toContain("auteur:profils!annonces_auteur_id_fkey(");
  });

  it("ne lit jamais les coordonnées de l'auteur", () => {
    expect(SELECT_ANNONCE).not.toMatch(/telephone|email|reseau/);
  });
});
