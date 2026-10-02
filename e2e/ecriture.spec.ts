import { expect, test, type Page } from "@playwright/test";
import { surveillerErreurs } from "./outils";

// Le chemin le plus important de l'appli, en ÉCRITURE : publier une annonce, la retrouver sur le tableau
// et dans « Mes annonces », puis la supprimer. Le robot nettoie toujours derrière lui (même si le test échoue),
// et une annonce supprimée ne compte plus dans la limite de 5 publications par jour.
const PREFIXE = "Test automatique du robot";

async function supprimer(page: Page, url: string) {
  await page.goto(url);
  // On attend que la page soit affichée (elle arrive par morceaux) avant de chercher le bouton.
  const bouton = page.getByRole("button", { name: "Supprimer" });
  await bouton.waitFor({ state: "visible", timeout: 15_000 });
  await bouton.click();
  await expect(page).toHaveURL(/\/mes-annonces/, { timeout: 15_000 });
}

test("publier une annonce, la voir sur le tableau, puis la supprimer", async ({
  page,
}) => {
  const erreurs = surveillerErreurs(page);
  const titre = `${PREFIXE} ${Date.now()}`;
  let adresse: string | null = null;

  try {
    // 1. Publier
    await page.goto("/annonces/nouvelle");
    const formulaire = page.locator("form:has([name='titre'])");
    await formulaire.locator("input[name='type'][value='propose']").check();
    await formulaire
      .locator("select[name='categorie']")
      .selectOption("coup_de_main");
    await formulaire
      .locator("select[name='contrepartie']")
      .selectOption("gratuit");
    await formulaire.locator("input[name='titre']").fill(titre);
    await formulaire
      .locator("textarea[name='description']")
      .fill(
        "Annonce publiée par le robot de test pour vérifier l'appli. Elle est supprimée dans les secondes qui suivent.",
      );
    await formulaire.getByRole("button", { name: "Publier l'annonce" }).click();

    await expect(page).toHaveURL(/\/annonces\/[0-9a-f-]{36}\?ok=publiee/, {
      timeout: 20_000,
    });
    adresse = page.url().split("?")[0];
    await expect(page.getByText(titre).first()).toBeVisible();

    // 2. La retrouver sur le tableau et dans « Mes annonces »
    await page.goto("/annonces");
    await expect(
      page.locator("article").filter({ hasText: titre }),
      "l'annonce publiée n'est pas sur le tableau",
    ).toBeVisible();
    await page.goto("/mes-annonces");
    await expect(page.getByText(titre).first()).toBeVisible();

    // 3. La supprimer : elle disparaît partout
    await supprimer(page, adresse);
    await expect(page.getByText(titre)).toHaveCount(0);
    // La page de l'annonce affiche « Introuvable » (le code HTTP reste 200 : la page arrive en streaming).
    await page.goto(adresse);
    await expect(
      page.getByRole("heading", { name: "Introuvable" }),
      "l'annonce supprimée est encore accessible",
    ).toBeVisible();
    adresse = null;

    expect(erreurs).toEqual([]);
  } finally {
    // Ménage, même si une étape a échoué.
    if (adresse) await supprimer(page, adresse).catch(() => {});
  }
});
