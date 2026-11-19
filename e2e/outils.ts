import { expect, test, type Page } from "@playwright/test";

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

// Écart d'hydratation (React #418) : on joint au rapport le HTML envoyé par le serveur et la page finale du
// navigateur, pour trouver à coup sûr l'élément qui diffère (l'erreur minifiée ne le dit pas).
export async function joindreSiHydratation(page: Page, chemin: string, erreurs: string[]) {
  if (!erreurs.some((e) => e.includes("#418"))) return;
  const serveur = await (await page.request.get(chemin)).text();
  const nom = chemin.replace(/\W+/g, "-");
  await test.info().attach(`html-serveur${nom}.html`, { body: serveur, contentType: "text/plain" });
  await test.info().attach(`dom-navigateur${nom}.html`, { body: await page.content(), contentType: "text/plain" });
}
