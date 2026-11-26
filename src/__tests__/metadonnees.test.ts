// Robot (26/11) : l'erreur React #418 sur Réglages, un jour sur deux. L'espion d'hydratation a montré qu'au moment
// d'hydrater, un <meta charset> se trouvait au début du <body> au lieu de <head>. Next.js « streame » les métadonnées
// vers les navigateurs : selon la vitesse de la réponse, elles arrivent dans <head> ou à la fin du <body>.
// Nos métadonnées sont fixes (ou lues en cache) : on les envoie toujours dans <head>, d'un bloc.
import { describe, expect, it } from "vitest";
import config from "../../next.config";

describe("métadonnées", () => {
  it("toujours dans <head> (streaming des métadonnées désactivé, documentation Next.js)", () => {
    expect(config.htmlLimitedBots).toBeInstanceOf(RegExp);
    expect(String(config.htmlLimitedBots)).toBe("/.*/");
  });
});
