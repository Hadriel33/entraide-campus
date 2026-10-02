import { expect, test as setup } from "@playwright/test";

// Connexion du compte robot (identifiants dans les secrets GitHub E2E_EMAIL / E2E_PASSWORD, jamais dans le code).
// La session est gardée dans e2e/.auth/ (ignoré par git) pour les parcours suivants.
setup("connexion du compte robot", async ({ page }) => {
  await page.goto("/connexion");
  await page.getByLabel("Email").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Mot de passe").fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: /connecter/i }).click();
  await expect(page).toHaveURL(/\/(bureau|bienvenue)/, { timeout: 20_000 });
  await page.context().storageState({ path: "e2e/.auth/etudiant.json" });
});
