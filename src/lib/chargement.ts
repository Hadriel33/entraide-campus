// Les pages d'avant connexion (accueil, connexion, inscription...) n'ont pas l'écran « Colette cherche » :
// on n'y cherche rien. Elles gardent un chargement discret (retour de Hadriel du 26/11).
const PAGES_PUBLIQUES = new Set(["/", "/connexion", "/inscription", "/mot-de-passe-oublie", "/confidentialite"]);

export function chargementDiscret(chemin: string) {
  return PAGES_PUBLIQUES.has(chemin) || chemin.startsWith("/auth/");
}
