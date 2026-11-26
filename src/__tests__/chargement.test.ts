// Retour de Hadriel (26/11) : avant d'entrer dans l'appli (accueil, connexion, inscription), l'écran de chargement
// « deux secondes, je cherche... » avec Colette n'a pas de sens : on ne cherche rien. Ces pages ont un chargement discret.
import { describe, expect, it } from "vitest";
import { chargementDiscret } from "@/lib/chargement";

describe("écran de chargement", () => {
  it("discret sur les pages d'avant connexion", () => {
    for (const p of ["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/confidentialite", "/auth/confirmer"]) {
      expect(chargementDiscret(p), p).toBe(true);
    }
  });
  it("Colette qui cherche dans l'appli, là où l'on cherche vraiment", () => {
    for (const p of ["/annonces", "/bureau", "/demandes", "/compte", "/connexion-test"]) {
      expect(chargementDiscret(p), p).toBe(false);
    }
  });
});
