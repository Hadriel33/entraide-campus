// Défi de la semaine : un défi différent chaque semaine (rotation fixe sur le numéro de semaine ISO).
// La progression est calculée en base (fonction progression_defi, migration 0014) ; la même rotation y est codée.
export const DEFIS = [
  { code: "croisement", titre: "Entraide ESD × ESP", description: "Réussis une mise en relation avec un étudiant de l'autre école.", objectif: 1 },
  { code: "aider", titre: "Main tendue", description: "Accepte 2 demandes de contact sur tes annonces.", objectif: 2 },
  { code: "avis", titre: "Retour d'expérience", description: "Laisse 2 avis après des entraides.", objectif: 2 },
  { code: "publier", titre: "Nouvelle annonce", description: "Publie une annonce cette semaine.", objectif: 1 },
] as const;

export const BONUS_DEFI = 20;

// Numéro de semaine ISO 8601 (la semaine commence le lundi).
export function semaineIso(date: Date): number {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const jour = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jour);
  const debutAnnee = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - debutAnnee.getTime()) / 86_400_000 + 1) / 7);
}

export function defiDeLaSemaine(date = new Date()) {
  return DEFIS[semaineIso(date) % DEFIS.length];
}
