// Règles déterministes autour de l'IA : nettoyage de ses réponses et filet de sécurité quand elle échoue.

export type StatutModeration = "en_attente" | "ok" | "a_verifier" | "refus_probable";
export type ReponseModeration = { statut: "ok" | "a_verifier" | "refus_probable"; raisons: string[] };

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
