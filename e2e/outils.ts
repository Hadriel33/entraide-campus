import { expect, type Page } from "@playwright/test";

// Erreurs JavaScript de la page (un composant qui plante) : on les collecte pour échouer franchement.
export function surveillerErreurs(page: Page) {
  const erreurs: string[] = [];
  // Chaque erreur porte la page affichée à ce moment-là : une erreur tardive se range sur la bonne page.
  const ou = () => new URL(page.url()).pathname;
  page.on("pageerror", (e) => erreurs.push(`${e.message} (sur ${ou()})`));
  page.on("console", (m) => {
    if (
      m.type() === "error" &&
      !/favicon|Failed to load resource|tile\.openstreetmap/i.test(m.text())
    )
      erreurs.push(`${m.text()} (sur ${ou()})`);
  });
  return erreurs;
}

// Rien ne dépasse à droite (pas de défilement horizontal, surtout sur téléphone).
export async function pasDeDebordement(page: Page) {
  const { large, vue } = await page.evaluate(() => ({
    large: document.documentElement.scrollWidth,
    vue: window.innerWidth,
  }));
  expect(large, "la page déborde horizontalement").toBeLessThanOrEqual(vue + 1);
}
