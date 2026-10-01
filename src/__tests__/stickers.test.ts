import { describe, expect, it } from "vitest";
import { STICKERS, contenuSticker, stickerDe } from "@/lib/messages/stickers";

describe("stickers de Colette", () => {
  it("reconnaît chaque sticker envoyé", () => {
    for (const s of STICKERS) expect(stickerDe(contenuSticker(s.code))?.code).toBe(s.code);
  });

  it("laisse les messages normaux en texte", () => {
    expect(stickerDe("Merci beaucoup !")).toBeNull();
    expect(stickerDe("regarde [colette:merci] ici")).toBeNull();
  });

  it("affiche en texte un code inconnu (pas d'image inventée)", () => {
    expect(stickerDe("[colette:inconnu]")).toBeNull();
    expect(stickerDe("[colette:MERCI]")).toBeNull();
  });

  it("tient dans la limite des messages", () => {
    for (const s of STICKERS) expect(contenuSticker(s.code).length).toBeLessThanOrEqual(1000);
  });
});
