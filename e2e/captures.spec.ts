import { test } from "@playwright/test";

// Photos du site EN LIGNE, connecté avec le compte robot (lecture seule) : pour vérifier d'un coup d'œil
// ce qu'un étudiant voit vraiment. Rangées dans l'onglet Actions › Parcours › artefact « captures ».
const PAGES = [
  ["bureau", "/bureau"],
  ["tableau", "/annonces?campus=tous"],
  ["fil", "/fil"],
  ["carte", "/carte"],
  ["classement", "/classement"],
  ["profil", "/compte"],
  ["reglages", "/reglages"],
  ["ia", "/ia"],
  ["nouvelle", "/annonces/nouvelle"],
] as const;

for (const [nom, chemin] of PAGES) {
  test(`capture : ${nom}`, async ({ page }, info) => {
    await page.goto(chemin);
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: `captures/${info.project.name}-${nom}.png`, fullPage: true });
  });
}

test("capture : bulle de Colette ouverte", async ({ page }, info) => {
  await page.goto("/fil");
  await page.getByRole("button", { name: /^Messages/ }).click();
  await page.getByRole("tab", { name: "Salons" }).click();
  await page.screenshot({ path: `captures/${info.project.name}-bulle.png` });
});
