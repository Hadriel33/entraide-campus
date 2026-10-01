// Règles déterministes autour de l'IA : nettoyage de ses réponses et filet de sécurité quand elle échoue.

export type StatutModeration = "en_attente" | "ok" | "a_verifier" | "refus_probable";
export type Correction = { titre: string; description: string };
export type ReponseModeration = { statut: "ok" | "a_verifier" | "refus_probable"; raisons: string[]; suggestion?: Correction | null };

const TELEPHONE = /(?:\+33[\s.-]?|\b0)[1-9](?:[\s.-]?\d{2}){4}\b/;
const EMAIL = /[^\s@]+@[^\s@]+\.[a-z]{2,}/i;

export function nettoyerCompetences(brutes: string[]): string[] {
  const vues = new Set<string>();
  const resultat: string[] = [];
  for (const brute of brutes) {
    const c = brute.trim().replace(/\s+/g, " ");
    const cle = c.toLocaleLowerCase("fr");
    if (c.length < 2 || c.length > 40 || vues.has(cle)) continue;
    vues.add(cle);
    resultat.push(c);
    if (resultat.length === 15) break;
  }
  return resultat;
}

// Téléphone ou email écrits dans une annonce : contournement de la règle d'or n°1.
export function detecterCoordonnees(texte: string): boolean {
  return TELEPHONE.test(texte) || EMAIL.test(texte);
}

const ORDRE: Record<StatutModeration, number> = { en_attente: 0, ok: 0, a_verifier: 1, refus_probable: 2 };

// Décision finale : l'IA propose, les règles fixes ne peuvent que rendre la décision plus stricte.
// IA en panne (null) : « en attente », donc un humain regardera.
export function deciderModeration(ia: ReponseModeration | null, texte: string): { statut: StatutModeration; raisons: string[] } {
  let statut: StatutModeration = ia?.statut ?? "en_attente";
  const raisons = [...(ia?.raisons ?? [])];

  if (detecterCoordonnees(texte)) {
    raisons.unshift("Coordonnées écrites dans l'annonce (elles doivent s'échanger après accord).");
    if (ORDRE[statut] < ORDRE.a_verifier) statut = "a_verifier";
  }

  return { statut, raisons: raisons.slice(0, 5).map((r) => (r.length > 160 ? `${r.slice(0, 157)}...` : r)) };
}

const TELEPHONE_TOUS = new RegExp(TELEPHONE.source, "g");
const EMAIL_TOUS = new RegExp(EMAIL.source, "gi");
const MENTION = "(coordonnées retirées : elles s'échangent après accord dans l'appli)";

// Plan B déterministe : on enlève téléphones et emails du texte.
export function retirerCoordonnees(texte: string) {
  return texte.replace(TELEPHONE_TOUS, MENTION).replace(EMAIL_TOUS, MENTION).replace(new RegExp(`(\(coordonnées retirées[^)]*\)\s*(ou|et|,)?\s*)+`, "g"), `${MENTION} `).trim();
}

function correctionValide(c: Correction | null | undefined): c is Correction {
  if (!c) return false;
  const titre = c.titre.trim();
  const description = c.description.trim();
  return titre.length >= 5 && titre.length <= 80 && description.length >= 20 && description.length <= 1000 && !detecterCoordonnees(`${titre}
${description}`);
}

// IA n°2, version 2 : quand une annonce pose problème mais peut être réparée, on propose à l'AUTEUR une version
// corrigée. Il l'accepte ou non (un humain valide toujours). Pas de proposition pour une annonce ok ni pour un
// refus probable (arnaque, contenu interdit) : là, c'est l'admin qui décide.
export function proposerCorrection(ia: ReponseModeration | null, annonce: Correction, statutFinal: StatutModeration): Correction | null {
  if (statutFinal !== "a_verifier") return null;
  const origine = { titre: annonce.titre.trim(), description: annonce.description.trim() };
  let proposition: Correction | null = correctionValide(ia?.suggestion) ? { titre: ia!.suggestion!.titre.trim(), description: ia!.suggestion!.description.trim() } : null;
  if (!proposition && detecterCoordonnees(`${origine.titre}
${origine.description}`)) {
    proposition = { titre: retirerCoordonnees(origine.titre), description: retirerCoordonnees(origine.description) };
    if (!correctionValide(proposition)) return null;
  }
  if (!proposition) return null;
  if (proposition.titre === origine.titre && proposition.description === origine.description) return null;
  return proposition;
}
