// Style des champs de saisie de la charte (bordure épaisse, ombre jaune au focus), partagé par tous les champs
// et toutes les listes déroulantes (test saisie.test.ts). Le chevron des listes est dans globals.css.
export const SAISIE =
  "min-h-11 rounded-ui border-2 border-ligne-forte bg-surface px-3 py-2 text-base font-normal outline-none transition-shadow focus:border-encre focus:shadow-[3px_3px_0_0_var(--color-bandeau)] aria-[invalid=true]:border-alerte";

// Variante compacte : filtres du tableau, tableaux de l'admin, petit formulaire de signalement.
export const SAISIE_COMPACTE =
  "min-h-9 rounded-ui border-2 border-ligne-forte bg-surface px-2 text-sm font-normal outline-none transition-shadow focus:border-encre focus:shadow-[2px_2px_0_0_var(--color-bandeau)]";
