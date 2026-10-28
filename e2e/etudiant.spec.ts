import { expect, test } from "@playwright/test";
import { pasDeDebordement, surveillerErreurs } from "./outils";

// Le parcours d'un étudiant connecté, EN LECTURE SEULE (rien n'est publié ni accepté en prod).
// Il aurait attrapé le bug du 02/10 : tableau, liste et détail des annonces vides.

test("le tableau affiche des post-its, avec leur auteur", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/annonces");
  await expect(
    page.getByRole("heading", { name: /Le tableau/i }),
  ).toBeVisible();
  const postits = page.locator("article");
  await expect(
    postits.first(),
    "le tableau est vide : la requête des annonces a échoué ?",
  ).toBeVisible();
  expect(await postits.count()).toBeGreaterThan(0);
  await expect(postits.first().getByText(/^@/).first()).toBeVisible();
  await pasDeDebordement(page);
  expect(erreurs).toEqual([]);
});

test("un post-it s'ouvre sur sa page", async ({ page }) => {
  await page.goto("/annonces");
  const titre = (await page.locator("article h3").first().innerText()).trim();
  // Centré dans l'écran : sur téléphone, la barre du haut (fixe) peut recouvrir le post-it.
  const lien = page.locator("article h3 a").first();
  await lien.evaluate((el) => el.scrollIntoView({ block: "center" }));
  await lien.click();
  await expect(page).toHaveURL(/\/annonces\/[0-9a-f-]{36}/);
  await expect(page.getByText(titre).first()).toBeVisible();
});

test("les filtres et le tri « Pour moi » répondent", async ({ page }) => {
  await page.goto("/annonces?type=cherche");
  await expect(page.locator("article").first()).toBeVisible();
  await page.goto("/annonces?tri=pour_moi");
  await expect(page.getByText(/Classé d'après ton profil/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Demander à Colette/i }),
  ).toBeVisible();
});

test("chaque punaise de la carte est cliquable et ouvre son quartier", async ({
  page,
}) => {
  await page.goto("/carte");
  const punaises = page.locator(
    "figure button[popovertarget]:not([popovertargetaction])",
  );
  await expect(punaises.first()).toBeVisible();
  // Aucune punaise ne doit être cachée sous une voisine (le point cliqué doit tomber sur elle).
  const cachees = await punaises.evaluateAll((liste) =>
    liste
      .filter((b) => {
        b.scrollIntoView({ block: "center", inline: "center" });
        const r = b.getBoundingClientRect();
        const dessus = document.elementFromPoint(
          r.left + r.width / 2,
          r.top + r.height / 2,
        );
        return !dessus || !b.contains(dessus);
      })
      .map((b) => b.getAttribute("aria-label")),
  );
  expect(cachees, "punaises recouvertes par une autre").toEqual([]);
  await page.getByRole("button", { name: /Victor Hugo/ }).click();
  await expect(
    page.locator("[popover]:popover-open").getByText(/Quartier/i),
  ).toBeVisible();
});

test("le bureau, les badges et leur post-it", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/bureau");
  await expect(page.getByRole("heading", { name: /Salut/i })).toBeVisible();
  await page.locator("button[popovertarget*='badge']").first().click();
  await expect(
    page
      .locator("[popover]:popover-open")
      .getByRole("button", { name: "Fermer" }),
  ).toBeVisible();
  expect(erreurs).toEqual([]);
});

test("les autres pages s'affichent sans erreur", async ({ page }) => {
  for (const [chemin, titre] of [
    ["/demandes", /Demandes/i],
    ["/classement", /Classement/i],
    ["/compte", /Mon profil/i],
    ["/mes-annonces", /annonces/i],
    ["/mur", /Le tableau/i],
    ["/fil", /Le fil/i],
    ["/reglages", /Réglages/i],
  ] as const) {
    const erreurs = surveillerErreurs(page);
    await page.goto(chemin);
    await expect(
      page.getByRole("heading", { name: titre }).first(),
      chemin,
    ).toBeVisible();
    // On attend la fin du chargement : une erreur tardive est rangée sur SA page, pas sur la suivante.
    await page.waitForLoadState("networkidle");
    await pasDeDebordement(page);
    expect(erreurs, chemin).toEqual([]);
  }
});

test("la bulle de Colette ouvre les salons du campus", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/fil");
  await page.getByRole("button", { name: /^Messages/ }).click();
  await page.getByRole("tab", { name: "Salons" }).click();
  await expect(page.getByRole("button", { name: /Général/ })).toBeVisible();
  await page.getByRole("button", { name: /Général/ }).click();
  await expect(page.getByPlaceholder(/Écrire dans Général/)).toBeVisible();
  expect(erreurs).toEqual([]);
});

// Retour du prof : on reconnaît chaque type d'annonce au premier coup d'œil (forme + pictogramme).
test("chaque post-it a la forme et le pictogramme de sa catégorie", async ({ page }) => {
  const { forme } = await import("../src/lib/design/formes");
  await page.goto("/annonces?campus=tous");
  const postits = page.locator("article[data-forme]");
  await expect(postits.first()).toBeVisible();
  const vus = await postits.evaluateAll((els) =>
    els.map((e) => ({ forme: e.getAttribute("data-forme"), categorie: e.getAttribute("data-categorie"), picto: !!e.querySelector("svg") })),
  );
  for (const v of vus) {
    expect(v.forme, `catégorie ${v.categorie}`).toBe(forme(v.categorie ?? ""));
    expect(v.picto, `pictogramme ${v.categorie}`).toBe(true);
  }
  expect(new Set(vus.map((v) => v.forme)).size, "plusieurs formes sur le tableau").toBeGreaterThanOrEqual(3);
});

test("les IA de Colette sont expliquées et signalées là où elles travaillent", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/ia");
  await expect(page.getByRole("heading", { name: /Les IA de Colette/i })).toBeVisible();
  for (const n of [1, 2, 3, 4]) await expect(page.locator(`#ia-${n}`)).toBeVisible();
  // La pastille bleue sur le formulaire de publication renvoie à l'IA n°2.
  await page.goto("/annonces/nouvelle");
  await expect(page.locator('a[href="/ia#ia-2"]')).toBeVisible();
  await page.goto("/compte");
  await expect(page.locator('a[href="/ia#ia-1"]')).toBeVisible();
  await pasDeDebordement(page);
  expect(erreurs).toEqual([]);
});

test("le bureau montre ma série de semaines, le fil retient ma visite", async ({ page }) => {
  await page.goto("/bureau");
  await expect(page.getByRole("heading", { name: "Ma série" })).toBeVisible();
  await page.goto("/fil");
  await page.waitForLoadState("networkidle");
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === "fil_vu"), "la date de visite du fil n'est pas retenue").toBe(true);
  // Deuxième visite : le bandeau des nouveautés apparaît.
  await page.reload();
  await expect(page.getByRole("status").filter({ hasText: /dernière visite/ })).toBeVisible();
});

test("« Ça monte » classe les post-its soutenus, chaque post-it a son bouton « Je soutiens »", async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await page.goto("/annonces?tri=ca_monte&campus=tous");
  await expect(page.getByText(/Les post-its les plus soutenus/)).toBeVisible();
  const postits = page.locator("article[data-forme]");
  await expect(postits.first(), "« Ça monte » est vide : la fonction annonces_ca_monte a échoué ?").toBeVisible();
  await expect(postits.first().getByRole("button", { name: /soutien/i })).toBeVisible();
  await pasDeDebordement(page);
  expect(erreurs).toEqual([]);
});
