import type { Categorie } from "./validation";

// Annonces qui expirent : plus d'annonces mortes (le défaut des groupes Facebook).
// Logement et trajets bougent vite ; une compétence reste valable plus longtemps.
// Mêmes durées en base (fonction duree_expiration, migration 0014).
const COURTES: Categorie[] = ["coloc", "covoiturage", "materiel", "shooting", "coup_de_main"];

export function dureeExpiration(categorie: Categorie): number {
  return COURTES.includes(categorie) ? 14 : 45;
}

export function joursRestants(expireLe: string, maintenant = new Date()): number {
  return Math.max(0, Math.ceil((new Date(expireLe).getTime() - maintenant.getTime()) / 86_400_000));
}
