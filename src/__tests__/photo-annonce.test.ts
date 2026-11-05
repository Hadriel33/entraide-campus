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
