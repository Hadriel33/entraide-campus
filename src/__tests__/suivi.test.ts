import { describe, expect, it } from "vitest";
import { ETAPES, colonneEchange, etapesDatees, etapesSuivantes, jeSuisAide, peutConfirmer, validerAvancement } from "@/lib/echanges/suivi";

const moi = "11111111-1111-4111-8111-111111111111";
const autre = "22222222-2222-4222-8222-222222222222";

describe("qui aide dans un échange", () => {
  it("post-it « Je propose » : c'est l'auteur (ou son équipe) qui aide, pas celui qui a demandé le contact", () => {
    expect(jeSuisAide({ type: "propose", demandeurId: autre, moi })).toBe(true);
    expect(jeSuisAide({ type: "propose", demandeurId: moi, moi })).toBe(false);
  });
  it("post-it « Je cherche » : c'est celui qui a demandé le contact qui vient aider", () => {
    expect(jeSuisAide({ type: "cherche", demandeurId: moi, moi })).toBe(true);
    expect(jeSuisAide({ type: "cherche", demandeurId: autre, moi })).toBe(false);
  });
});

describe("les étapes du suivi (Colette livreuse)", () => {
  it("4 arrêts dans l'ordre, chacun avec un libellé et une Colette", () => {
    expect(ETAPES.map((e) => e.code)).toEqual(["parti", "en_cours", "presque", "livre"]);
    for (const e of ETAPES) {
      expect(e.label.length).toBeGreaterThan(3);
      expect(e.colette.anim).toBeTruthy();
    }
  });
  it("on avance, on ne recule pas ; on peut garder l'étape pour changer son petit mot", () => {
    expect(etapesSuivantes(null)).toEqual(["parti", "en_cours", "presque", "livre"]);
    expect(etapesSuivantes("en_cours")).toEqual(["en_cours", "presque", "livre"]);
    expect(etapesSuivantes("livre")).toEqual([]);
    expect(etapesSuivantes("recu")).toEqual([]);
  });
  it("valide l'étape et le petit mot (facultatif, court, sans coordonnées)", () => {
    expect(validerAvancement({ actuelle: null, etape: "en_cours", mot: "  je monte la vidéo  " })).toEqual({ etape: "en_cours", mot: "je monte la vidéo" });
    expect(validerAvancement({ actuelle: "presque", etape: "livre", mot: "" })).toEqual({ etape: "livre", mot: null });
    expect(validerAvancement({ actuelle: "presque", etape: "parti", mot: "" })).toBeNull(); // pas de retour en arrière
    expect(validerAvancement({ actuelle: null, etape: "recu", mot: "" })).toBeNull(); // « Bien reçu » : c'est l'autre qui le dit
    expect(validerAvancement({ actuelle: null, etape: "pirate", mot: "" })).toBeNull();
    expect(validerAvancement({ actuelle: null, etape: "parti", mot: "x".repeat(81) })).toBeNull();
    expect(validerAvancement({ actuelle: null, etape: "parti", mot: "appelle-moi au 06 12 34 56 78" })).toBeNull();
  });
  it("« Bien reçu » seulement quand c'est livré, et seulement par celui qui reçoit", () => {
    expect(peutConfirmer({ etape: "livre", aide: false })).toBe(true);
    expect(peutConfirmer({ etape: "livre", aide: true })).toBe(false);
    expect(peutConfirmer({ etape: "presque", aide: false })).toBe(false);
    expect(peutConfirmer({ etape: "recu", aide: false })).toBe(false);
  });
});

describe("Mes échanges : dans quelle colonne", () => {
  it("à traiter, en cours, terminé", () => {
    expect(colonneEchange({ statut: "en_attente", etape: null })).toBe("a_traiter");
    expect(colonneEchange({ statut: "acceptee", etape: null })).toBe("en_cours");
    expect(colonneEchange({ statut: "acceptee", etape: "livre" })).toBe("en_cours");
    expect(colonneEchange({ statut: "acceptee", etape: "recu" })).toBe("termine");
    expect(colonneEchange({ statut: "refusee", etape: null })).toBe("refusee");
  });
});

describe("le parcours daté d'un échange (Historique)", () => {
  it("demandé, accepté, bien reçu : chaque étape avec sa date, à l'heure de Paris", () => {
    expect(
      etapesDatees({ statut: "acceptee", creeLe: "2026-11-02T10:00:00Z", reponduLe: "2026-11-03T09:00:00Z", etape: "recu", suiviLe: "2026-11-18T23:30:00Z" }),
    ).toEqual([
      { label: "Demandé", date: "2 nov." },
      { label: "Accepté", date: "3 nov." },
      { label: "Bien reçu", date: "19 nov." }, // 23 h 30 UTC = minuit et demi à Paris : le 19
    ]);
  });
  it("refusé : demandé puis refusé ; en cours : pas encore de « Bien reçu »", () => {
    expect(etapesDatees({ statut: "refusee", creeLe: "2026-11-02T10:00:00Z", reponduLe: "2026-11-04T10:00:00Z", etape: null, suiviLe: null }).map((e) => e.label)).toEqual(["Demandé", "Refusé"]);
    expect(etapesDatees({ statut: "acceptee", creeLe: "2026-11-02T10:00:00Z", reponduLe: null, etape: "presque", suiviLe: "2026-11-05T10:00:00Z" }).map((e) => e.label)).toEqual(["Demandé", "Accepté"]);
  });
});
