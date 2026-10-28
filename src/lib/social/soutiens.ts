// « Je soutiens » : pousser le post-it d'un pote, ou dire « ça me concerne aussi ».
// Les règles sont en base (migration 0028) : un soutien par personne, pas sur son propre post-it, aucun point.

export type ResumeSoutien = { n: number; moi: boolean };

export function resumerSoutiens(lignes: { annonce_id: string; auteur_id: string }[], moi: string | null | undefined) {
  const parAnnonce = new Map<string, ResumeSoutien>();
  for (const l of lignes) {
    const r = parAnnonce.get(l.annonce_id) ?? { n: 0, moi: false };
    r.n += 1;
    if (moi && l.auteur_id === moi) r.moi = true;
    parAnnonce.set(l.annonce_id, r);
  }
  return parAnnonce;
}

// Paliers où l'auteur est prévenu (les mêmes qu'en base) : on fête le cap, on ne spamme pas.
export const PALIERS_SOUTIEN = [1, 3, 5, 10, 20, 50] as const;
export function estPalierSoutien(n: number) {
  return (PALIERS_SOUTIEN as readonly number[]).includes(n);
}

export function texteSoutiens(n: number) {
  if (n <= 0) return "Sois le premier à soutenir";
  return `${n} soutien${n > 1 ? "s" : ""}`;
}
