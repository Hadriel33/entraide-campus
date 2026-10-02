import { defineConfig, devices } from "@playwright/test";

// Parcours de bout en bout : un vrai navigateur sur l'appli EN LIGNE, comme un étudiant.
// - Pages publiques : toujours testées.
// - Parcours connecté : seulement si E2E_EMAIL et E2E_PASSWORD existent (secrets GitHub du compte robot,
//   jamais dans le code). En lecture seule : rien n'est publié en prod.
// Lancement : npm run e2e (E2E_URL pour viser un autre déploiement).
const URL = process.env.E2E_URL ?? "https://entraide-campus.vercel.app";
const connecte = !!(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

export default defineConfig({
  testDir: "e2e",
  timeout: 45_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: { baseURL: URL, trace: "retain-on-failure", locale: "fr-FR" },
  projects: [
    {
      name: "public",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "public-telephone",
      testMatch: /public\.spec\.ts/,
      use: { ...devices["Pixel 7"] },
    },
    ...(connecte
      ? [
          {
            name: "connexion",
            testMatch: /connexion\.setup\.ts/,
            use: { ...devices["Desktop Chrome"] },
          },
          {
            // Le parcours d'écriture (publier puis supprimer) ne tourne qu'ici, une fois par passage.
            name: "etudiant",
            testMatch: /(etudiant|ecriture)\.spec\.ts/,
            dependencies: ["connexion"],
            use: {
              ...devices["Desktop Chrome"],
              storageState: "e2e/.auth/etudiant.json",
            },
          },
          {
            name: "etudiant-telephone",
            testMatch: /etudiant\.spec\.ts/,
            dependencies: ["connexion"],
            use: {
              ...devices["Pixel 7"],
              storageState: "e2e/.auth/etudiant.json",
            },
          },
        ]
      : []),
  ],
});
