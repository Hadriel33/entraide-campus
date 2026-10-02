import { expect, test } from "@playwright/test";
import { pasDeDebordement, surveillerErreurs } from "./outils";

// Le parcours d'un étudiant connecté, EN LECTURE SEULE (rien n'est publié ni accepté en prod).
// Il aurait attrapé le bug du 02/10 : tableau, liste et détail des annonces vides.

test("le tableau affiche des post-its, avec leur auteur", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/annonces");
  await expect(page.getByRole("heading", { name: /Le tableau/i })).toBeVisible();
  const postits = page.locator("article");
  await expect(postits.first(), "le tableau est vide : la requête des annonces a échoué ?").toBeVisible();
  expect(await postits.count()).toBeGreaterThan(0);
  await expect(postits.first().getByText(/^@/).first()).toBeVisible();
  await pasDeDebordement(page);
  expect(erreurs).toEqual([]);
});

test("un post-it s'ouvre sur sa page", async ({ page }) => {
  await page.goto("/annonces");
  const titre = (await page.locator("article h3").first().innerText()).trim();
  await page.locator("article h3 a").first().click();
  await expect(page).toHaveURL(/\/annonces\/[0-9a-f-]{36}/);
  await expect(page.getByText(titre).first()).toBeVisible();
});

test("les filtres et le tri « Pour moi » répondent", async ({ page }) => {
  await page.goto("/annonces?type=cherche");
  await expect(page.locator("article").first()).toBeVisible();
  await page.goto("/annonces?tri=pour_moi");
  await expect(page.getByText(/Classé d'après ton profil/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /Demander à Colette/i })).toBeVisible();
});

test("la carte ouvre le post-it d'un quartier", async ({ page }) => {
  await page.goto("/carte");
  const punaise = page.locator("figure button[popovertarget]").first();
  await punaise.click();
  await expect(page.locator("[popover]:popover-open").getByText(/Quartier/i)).toBeVisible();
});

test("le bureau, les badges et leur post-it", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/bureau");
  await expect(page.getByRole("heading", { name: /Salut/i })).toBeVisible();
  await page.locator("button[popovertarget*='badge']").first().click();
  await expect(page.locator("[popover]:popover-open").getByRole("button", { name: "Fermer" })).toBeVisible();
  expect(erreurs).toEqual([]);
});

test("les autres pages s'affichent sans erreur", async ({ page }) => {
  for (const [chemin, titre] of [
    ["/demandes", /Demandes/i],
    ["/classement", /Classement/i],
    ["/compte", /Mon profil/i],
    ["/mes-annonces", /annonces/i],
    ["/mur", /Le tableau/i],
  ] as const) {
    const erreurs = surveillerErreurs(page);
    await page.goto(chemin);
    await expect(page.getByRole("heading", { name: titre }).first(), chemin).toBeVisible();
    await pasDeDebordement(page);
    expect(erreurs, chemin).toEqual([]);
  }
});
