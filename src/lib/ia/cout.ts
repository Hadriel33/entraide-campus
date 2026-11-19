// Coût des IA (retour de test du 19/11 : « ajouter le coût par IA, avec un plafond »).
// Tarifs publics par million de tokens, en dollars (ce que facture la passerelle), convertis en euros.
// C'est une estimation : elle sert au plafond et au suivi dans l'admin, pas à la facturation.
export const EUR_PAR_USD = 0.92;

export const PRIX_MODELES: Record<string, { entree: number; sortie: number }> = {
  "google/gemini-2.5-flash": { entree: 0.3, sortie: 2.5 },
  "google/gemini-2.5-flash-lite": { entree: 0.1, sortie: 0.4 },
  "openai/gpt-4.1-mini": { entree: 0.4, sortie: 1.6 },
};

// Modèle inconnu (nom différent renvoyé par la passerelle) : on compte au tarif le plus cher, par prudence.
const PRUDENT = {
  entree: Math.max(...Object.values(PRIX_MODELES).map((p) => p.entree)),
  sortie: Math.max(...Object.values(PRIX_MODELES).map((p) => p.sortie)),
};

function tarif(modele: string) {
  const exact = PRIX_MODELES[modele];
  if (exact) return exact;
  // La passerelle peut renvoyer le nom sans le fournisseur (« gemini-2.5-flash »).
  const parNom = Object.entries(PRIX_MODELES).find(([k]) => k.endsWith(`/${modele}`));
  return parNom ? parNom[1] : PRUDENT;
}

export function coutEuros({ modele, entree, sortie }: { modele: string; entree: number; sortie: number }) {
  const p = tarif(modele);
  return ((entree * p.entree + sortie * p.sortie) / 1_000_000) * EUR_PAR_USD;
}

export function budgetAtteint(depense: number, plafond: number) {
  return depense >= plafond;
}
