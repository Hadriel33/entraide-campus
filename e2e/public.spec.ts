import { expect, test } from "@playwright/test";
import { pasDeDebordement, surveillerErreurs } from "./outils";

// Ce qu'un visiteur non connecté voit. Tourne sans aucun secret.

test("l'accueil s'affiche, sans erreur ni débordement", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/");
  await expect(page).toHaveTitle(/Post-it campus/);
  await expect(page.getByRole("link", { name: /Créer mon compte/i }).first()).toBeVisible();
  await pasDeDebordement(page);
  expect(erreurs).toEqual([]);
});

test("la connexion propose email et mot de passe", async ({ page }) => {
  await page.goto("/connexion");
  await expect(page.getByLabel("Email")).toBeVisible();
  await expect(page.getByLabel("Mot de passe")).toBeVisible();
  await pasDeDebordement(page);
});

test("les pages réservées renvoient vers la connexion", async ({ page }) => {
  for (const chemin of ["/annonces", "/bureau", "/demandes", "/admin", "/mur"]) {
    await page.goto(chemin);
    await expect(page, `${chemin} doit exiger une connexion`).toHaveURL(/\/connexion/);
  }
});

test("la page de confidentialité est publique", async ({ page }) => {
  await page.goto("/confidentialite");
  await expect(page.getByRole("heading").first()).toBeVisible();
  await pasDeDebordement(page);
});

test("une page inexistante affiche la 404 de Colette", async ({ page }) => {
  const reponse = await page.goto("/cette-page-n-existe-pas");
  expect(reponse?.status()).toBe(404);
  await expect(page.getByText(/Introuvable/i).first()).toBeVisible();
});
