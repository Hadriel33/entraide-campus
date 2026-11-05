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

// Un post-it AVEC photo (prêt de matériel) : la photo s'affiche sur sa page et sur le tableau, et quand on
// supprime le post-it, le fichier part aussi du bucket (RGPD : rien ne traîne).
test("publier un prêt de matériel avec photo, la voir, puis tout supprimer", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  const titre = `${PREFIXE} photo ${Date.now()}`;
  let adresse: string | null = null;

  try {
    await page.goto("/annonces/nouvelle");
    const formulaire = page.locator("form:has([name='titre'])");
    await formulaire.locator("input[name='type'][value='propose']").check();
    await formulaire.locator("select[name='categorie']").selectOption("materiel");
    await formulaire.locator("select[name='contrepartie']").selectOption("gratuit");
    await formulaire.locator("input[name='titre']").fill(titre);
    await formulaire
      .locator("textarea[name='description']")
      .fill("Je prête mon appareil photo pour un week-end. Post-it du robot de test, supprimé dans les secondes qui suivent.");
    await formulaire.locator("input[name='photo']").setInputFiles("e2e/fixtures/appareil-photo.png");
    // L'aperçu s'affiche avant même l'envoi.
    await expect(formulaire.getByAltText("Aperçu de la photo")).toBeVisible();
    await formulaire.getByRole("button", { name: "Publier l'annonce" }).click();

    await expect(page).toHaveURL(/\/annonces\/[0-9a-f-]{36}\?ok=publiee/, { timeout: 30_000 });
    adresse = page.url().split("?")[0];
    const photo = page.getByAltText(`Photo du post-it « ${titre} »`);
    await expect(photo, "la photo n'apparaît pas sur la page du post-it").toBeVisible();

    // L'adresse publique du fichier (derrière l'optimiseur d'images de Next).
    const src = decodeURIComponent((await photo.getAttribute("src")) ?? "");
    const fichier = /https:\/\/[^&]+\/storage\/v1\/object\/public\/annonces\/[^&]+/.exec(src)?.[0];
    expect(fichier, "la photo ne vient pas du bucket « annonces »").toBeTruthy();
    expect((await page.request.get(fichier!)).status()).toBe(200);

    // Sur le tableau : le post-it porte sa photo.
    await page.goto("/annonces?campus=tous");
    const carte = page.locator("article").filter({ hasText: titre });
    await expect(carte).toBeVisible();
    await expect(carte.locator("img").first()).toBeVisible();

    await supprimer(page, adresse);
    adresse = null;
    // Le fichier a disparu du bucket.
    // (paramètre anti-cache : on interroge le stockage, pas une copie gardée en cache)
    await expect.poll(async () => (await page.request.get(`${fichier}?apres=${Date.now()}`)).status(), { timeout: 15_000 }).not.toBe(200);

    expect(erreurs).toEqual([]);
  } finally {
    if (adresse) await supprimer(page, adresse).catch(() => {});
  }
});
