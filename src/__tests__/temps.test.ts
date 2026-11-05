import { describe, expect, it } from "vitest";
import { heureCampus } from "@/lib/temps";

// Le serveur (Vercel) est en UTC, le navigateur à l'heure de Paris : sans fuseau fixé, l'heure d'un message
// diffère entre les deux et React lève l'erreur d'hydratation #418.
describe("heure d'un message", () => {
  it("toujours à l'heure du campus (Paris), quel que soit le fuseau de la machine", () => {
    expect(heureCampus("2026-11-05T13:05:00Z")).toBe("5 nov., 14:05");
    expect(heureCampus("2026-07-01T08:30:00Z")).toBe("1 juil., 10:30"); // heure d'été
  });
});
