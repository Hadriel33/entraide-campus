import { describe, expect, it } from "vitest";
import { cheminPhotoAnnonce, urlPhotoAnnonce, validerPhotoAnnonce } from "@/lib/annonces/photo";
import { contenuModeration } from "@/lib/ia/regles";

describe("photo d'un post-it", () => {
  it("accepte une image JPEG, PNG ou WebP de 2 Mo au plus", () => {
    expect(validerPhotoAnnonce({ type: "image/jpeg", size: 1024 * 1024, name: "a.jpg" })).toEqual({ ok: true, photo: true });
    expect(validerPhotoAnnonce({ type: "image/webp", size: 2 * 1024 * 1024, name: "a.webp" })).toEqual({ ok: true, photo: true });
  });
  it("refuse un autre format ou un fichier trop lourd", () => {
    expect(validerPhotoAnnonce({ type: "image/gif", size: 1000, name: "a.gif" }).ok).toBe(false);
    expect(validerPhotoAnnonce({ type: "application/pdf", size: 1000, name: "a.pdf" }).ok).toBe(false);
    expect(validerPhotoAnnonce({ type: "image/jpeg", size: 2 * 1024 * 1024 + 1, name: "a.jpg" }).ok).toBe(false);
  });
  it("pas de fichier choisi : pas de photo, et ce n'est pas une erreur", () => {
    expect(validerPhotoAnnonce(null)).toEqual({ ok: true, photo: false });
    expect(validerPhotoAnnonce({ type: "application/octet-stream", size: 0, name: "" })).toEqual({ ok: true, photo: false });
  });
  it("range la photo dans le dossier de celui qui l'envoie (règle du bucket)", () => {
    const uid = "8f2c1e9a-1b2c-4d5e-9f00-123456789abc";
    const id = "11111111-2222-4333-8444-555555555555";
    expect(cheminPhotoAnnonce(uid, "image/png", id)).toBe(`${uid}/${id}.png`);
    expect(cheminPhotoAnnonce(uid, "image/jpeg", id)).toBe(`${uid}/${id}.jpg`);
    expect(urlPhotoAnnonce(`${uid}/${id}.png`)).toContain(`/storage/v1/object/public/annonces/${uid}/${id}.png`);
    expect(urlPhotoAnnonce(null)).toBeNull();
  });
});

describe("IA n°2 : Colette relit aussi la photo", () => {
  const annonce = { titre: "Je prête mon Sony A7", description: "Pour un week-end, contre un café.", lieu: null };
  it("sans photo : seulement le texte", () => {
    const c = contenuModeration(annonce, null);
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ type: "text" });
  });
  it("avec photo : le texte annonce la photo, et l'image est jointe", () => {
    const c = contenuModeration(annonce, "https://exemple.supabase.co/storage/v1/object/public/annonces/a/b.jpg");
    expect(c).toHaveLength(2);
    expect((c[0] as { text: string }).text).toContain("<photo>");
    expect(c[1]).toMatchObject({ type: "image" });
  });
});

describe("photo réduite dans le navigateur avant l'envoi (les photos de téléphone font 3 à 6 Mo)", () => {
  it("ramène le plus grand côté à 1600 px en gardant les proportions", async () => {
    const { dimensionsReduites } = await import("@/lib/annonces/photo");
    expect(dimensionsReduites(4032, 3024)).toEqual({ largeur: 1600, hauteur: 1200 });
    expect(dimensionsReduites(3024, 4032)).toEqual({ largeur: 1200, hauteur: 1600 });
  });
  it("ne grossit jamais une petite image", async () => {
    const { dimensionsReduites } = await import("@/lib/annonces/photo");
    expect(dimensionsReduites(800, 600)).toEqual({ largeur: 800, hauteur: 600 });
  });
});

describe("intervenir à distance (visio)", () => {
  it("« À distance (visio) » est un lieu valide, sans tram ni punaise sur la carte", async () => {
    const { QUARTIERS, validerAnnonce } = await import("@/lib/annonces/validation");
    const { pointDuQuartier } = await import("@/lib/carte/mercator");
    expect(QUARTIERS.a_distance).toBe("À distance (visio)");
    const r = validerAnnonce({ type: "propose", categorie: "dev", titre: "Je débloque ton code en visio", description: "Une heure en partage d'écran, tu repars avec un code qui marche.", contrepartie: "gratuit", lieu: "", quartier: "a_distance", tram: "" });
    expect(r.ok).toBe(true);
    expect(pointDuQuartier("a_distance")).toBeNull();
  });
});
