import { describe, it, expect } from "vitest";
import {
  deciderModeration,
  detecterCoordonnees,
  nettoyerCompetences,
  proposerCorrection,
  retirerCoordonnees,
} from "../regles";

describe("nettoyerCompetences", () => {
  it("retire les espaces, les vides et les doublons (sans tenir compte de la casse)", () => {
    expect(
      nettoyerCompetences(["  Photo ", "photo", "", "Retouche", "PHOTO"]),
    ).toEqual(["Photo", "Retouche"]);
  });
  it("écarte les compétences de plus de 40 caractères ou de moins de 2", () => {
    expect(nettoyerCompetences(["a", "x".repeat(41), "Montage vidéo"])).toEqual(
      ["Montage vidéo"],
    );
  });
  it("garde au maximum 15 compétences", () => {
    expect(
      nettoyerCompetences(
        Array.from({ length: 30 }, (_, i) => `Compétence ${i}`),
      ),
    ).toHaveLength(15);
  });
});

describe("detecterCoordonnees", () => {
  it("repère un numéro de téléphone français, avec ou sans espaces", () => {
    expect(detecterCoordonnees("Appelle-moi au 06 12 34 56 78")).toBe(true);
    expect(detecterCoordonnees("tel 0612345678")).toBe(true);
    expect(detecterCoordonnees("+33 6 12 34 56 78")).toBe(true);
  });
  it("repère une adresse email", () => {
    expect(detecterCoordonnees("écris à sam@exemple.fr")).toBe(true);
  });
  it("ne se déclenche pas sur un texte normal ou un prix", () => {
    expect(
      detecterCoordonnees("Cours de maths, 2 heures, 15 euros, tram A"),
    ).toBe(false);
    expect(detecterCoordonnees("Budget 550 euros, dès le 12/11")).toBe(false);
  });
});

describe("deciderModeration", () => {
  it("garde la décision de l'IA quand le texte est propre", () => {
    expect(
      deciderModeration(
        { statut: "ok", raisons: [] },
        "Photos pour vos soirées",
      ),
    ).toEqual({ statut: "ok", raisons: [] });
  });
  it("si l'IA est en panne, l'annonce reste en attente d'un humain", () => {
    expect(deciderModeration(null, "Photos pour vos soirées").statut).toBe(
      "en_attente",
    );
  });
  it("des coordonnées dans le texte forcent au moins « à vérifier », même si l'IA dit ok", () => {
    const d = deciderModeration(
      { statut: "ok", raisons: [] },
      "Appelle-moi au 06 12 34 56 78",
    );
    expect(d.statut).toBe("a_verifier");
    expect(d.raisons.join(" ")).toMatch(/coordonnées/i);
  });
  it("ne rétrograde jamais un refus probable", () => {
    expect(
      deciderModeration(
        { statut: "refus_probable", raisons: ["Arnaque"] },
        "06 12 34 56 78",
      ).statut,
    ).toBe("refus_probable");
  });
  it("si l'IA est en panne et qu'il y a des coordonnées, on le signale quand même", () => {
    const d = deciderModeration(null, "sam@exemple.fr");
    expect(d.statut).toBe("a_verifier");
  });
  it("limite les raisons à 5 phrases courtes", () => {
    const d = deciderModeration(
      {
        statut: "a_verifier",
        raisons: Array.from({ length: 9 }, () => "x".repeat(300)),
      },
      "texte",
    );
    expect(d.raisons.length).toBeLessThanOrEqual(5);
    expect(d.raisons.every((r) => r.length <= 160)).toBe(true);
  });
});

describe("IA n°2 : correction proposée à l'auteur", () => {
  const annonce = {
    titre: "Photos pour ton asso",
    description:
      "Je fais des photos de soirées, appelle-moi au 06 12 34 56 78.",
  };

  it("retire téléphone et email du texte", () => {
    const t = retirerCoordonnees(
      "Écris-moi : sam@exemple.fr ou 06 12 34 56 78 !",
    );
    expect(t).not.toMatch(/06 12|exemple\.fr/);
    expect(t).toMatch(/après accord/);
  });
  it("reprend la proposition de l'IA quand elle est valide et sans coordonnées", () => {
    const c = proposerCorrection(
      {
        statut: "a_verifier",
        raisons: ["Coordonnées"],
        suggestion: {
          titre: "Photos pour ton asso",
          description:
            "Je fais des photos de soirées et de galas, demande-moi le contact via l'appli.",
        },
      },
      annonce,
      "a_verifier",
    );
    expect(c?.description).toMatch(/via l'appli/);
  });
  it("si la proposition de l'IA contient encore des coordonnées, on retombe sur la correction automatique", () => {
    const c = proposerCorrection(
      {
        statut: "a_verifier",
        raisons: [],
        suggestion: {
          titre: "Photos",
          description: "Appelle le 06 12 34 56 78 pour des photos.",
        },
      },
      annonce,
      "a_verifier",
    );
    expect(c?.description).not.toMatch(/06 12/);
  });
  it("IA en panne mais coordonnées dans le texte : correction automatique quand même (plan B)", () => {
    const c = proposerCorrection(null, annonce, "a_verifier");
    expect(c?.description).not.toMatch(/06 12/);
    expect(c?.titre).toBe(annonce.titre);
  });
  it("rien à proposer pour une annonce ok ou une arnaque (refus probable : l'admin décide)", () => {
    expect(
      proposerCorrection(
        { statut: "ok", raisons: [], suggestion: null },
        { titre: "Photos", description: "Je fais des photos de soirées." },
        "ok",
      ),
    ).toBeNull();
    expect(
      proposerCorrection(
        {
          statut: "refus_probable",
          raisons: ["Arnaque"],
          suggestion: { titre: "x".repeat(10), description: "y".repeat(30) },
        },
        annonce,
        "refus_probable",
      ),
    ).toBeNull();
  });
  it("refuse une proposition hors limites ou identique au texte d'origine", () => {
    expect(
      proposerCorrection(
        {
          statut: "a_verifier",
          raisons: [],
          suggestion: { titre: "Ok", description: "court" },
        },
        {
          titre: "Titre propre",
          description: "Une description propre et assez longue.",
        },
        "a_verifier",
      ),
    ).toBeNull();
    expect(
      proposerCorrection(
        {
          statut: "a_verifier",
          raisons: [],
          suggestion: {
            titre: "Titre propre",
            description: "Une description propre et assez longue.",
          },
        },
        {
          titre: "Titre propre",
          description: "Une description propre et assez longue.",
        },
        "a_verifier",
      ),
    ).toBeNull();
  });
});

describe("IA n°3 : nettoyage du classement « pour moi »", async () => {
  const { nettoyerMatchs } = await import("../regles");
  it("ignore un id inventé et les doublons", () => {
    const m = nettoyerMatchs(
      [
        { id: "a", pertinence: 3, raison: "Ton Python colle" },
        { id: "zzz", pertinence: 3, raison: "inventé" },
        { id: "a", pertinence: 0, raison: "doublon" },
      ],
      ["a", "b"],
    );
    expect([...m.keys()]).toEqual(["a"]);
    expect(m.get("a")?.pertinence).toBe(3);
  });

  it("borne la note entre 0 et 3 et retire les coordonnées de la raison", () => {
    const m = nettoyerMatchs(
      [
        { id: "a", pertinence: 9, raison: "Appelle le 06 12 34 56 78" },
        { id: "b", pertinence: -2, raison: "" },
      ],
      ["a", "b"],
    );
    expect(m.get("a")?.pertinence).toBe(3);
    expect(m.get("a")?.raison).not.toMatch(/06 12/);
    expect(m.get("b")?.pertinence).toBe(0);
  });

  it("renvoie une liste vide si l'IA n'a rien renvoyé", () => {
    expect(nettoyerMatchs(null, ["a"]).size).toBe(0);
  });
});
