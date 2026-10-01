import type { Categorie, Contrepartie, TypeAnnonce } from "./validation";

// Colonnes lues pour afficher une annonce, avec le prénom et l'école de l'auteur (jamais ses coordonnées).
export const SELECT_ANNONCE =
  "id, type, categorie, titre, description, contrepartie, lieu, statut, cree_le, auteur_id, auteur:profils(prenom, ecole)";

export type Annonce = {
  id: string;
  type: TypeAnnonce;
  categorie: Categorie;
  titre: string;
  description: string;
  contrepartie: Contrepartie;
  lieu: string | null;
  statut: "publiee" | "archivee";
  cree_le: string;
  auteur_id: string;
  auteur: { prenom: string; ecole: string } | null;
};

export function dateCourte(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}
