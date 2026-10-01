import type { Categorie, Contrepartie, Quartier, Tram, TypeAnnonce } from "./validation";

// Colonnes lues pour afficher une annonce, avec le prénom et l'école de l'auteur (jamais ses coordonnées).
export const SELECT_ANNONCE =
  "id, type, categorie, titre, description, contrepartie, lieu, quartier, tram, expire_le, statut, cree_le, auteur_id, auteur:profils(prenom, pseudo, ecole, avatar_chemin, colette_couleur, colette_humeur, colette_accessoire)";

export type Annonce = {
  id: string;
  type: TypeAnnonce;
  categorie: Categorie;
  titre: string;
  description: string;
  contrepartie: Contrepartie;
  lieu: string | null;
  quartier: Quartier | null;
  tram: Tram | null;
  expire_le: string;
  statut: "publiee" | "archivee" | "masquee";
  cree_le: string;
  auteur_id: string;
  auteur: { prenom: string; pseudo: string; ecole: string; avatar_chemin: string | null; colette_couleur?: string; colette_humeur?: string; colette_accessoire?: string } | null;
};

export function dateCourte(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}
