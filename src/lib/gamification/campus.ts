import { CAMPUS, estCampus, type Campus } from "@/lib/auth/validation";

// Championnat des campus : score = moyenne des points des membres ACTIFS (au moins 1 point sur la saison),
// comme pour les classes. Les points viennent du même calcul anti-triche que le classement individuel.
export type ParticipantCampus = { campus: string; points: number };
export type LigneCampus = { campus: Campus; score: number; total: number; actifs: number; membres: number };

export function classerCampus(participants: ParticipantCampus[]): LigneCampus[] {
  return CAMPUS.map((campus) => {
    const membres = participants.filter((p) => estCampus(p.campus) && p.campus === campus);
    const actifs = membres.filter((p) => p.points > 0);
    const total = actifs.reduce((s, p) => s + p.points, 0);
    return { campus, total, actifs: actifs.length, membres: membres.length, score: actifs.length ? Math.round(total / actifs.length) : 0 };
  }).sort((a, b) => b.score - a.score || b.actifs - a.actifs || a.campus.localeCompare(b.campus));
}

// Une saison = un mois : le championnat repart à zéro le 1er, ce qui donne une raison de revenir.
export function debutSaison(maintenant = new Date()) {
  return new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), 1)).toISOString();
}

export function nomSaison(maintenant = new Date()) {
  return new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(maintenant);
}
