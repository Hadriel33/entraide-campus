// Ce qui donne envie de revenir : ce qui est nouveau depuis ma dernière visite, et ma série de semaines.

// Première visite (pas de date) : on ne marque rien, sinon tout le fil serait « nouveau ».
export function estNouveau(quand: string, derniereVisite: string | null | undefined) {
  if (!derniereVisite) return false;
  const vu = Date.parse(derniereVisite);
  if (Number.isNaN(vu)) return false;
  return Date.parse(quand) > vu;
}

export function texteSerie(n: number) {
  if (n <= 0) return "Pas encore de série : participe cette semaine pour la lancer";
  return `${n} semaine${n > 1 ? "s" : ""} d'affilée`;
}

export const COOKIE_FIL = "fil_vu";
