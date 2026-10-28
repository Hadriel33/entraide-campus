import type { Categorie, Contrepartie, Quartier, Tram, TypeAnnonce } from "./validation";

// Colonnes lues pour afficher une annonce, avec le prénom et le campus de l'auteur (jamais ses coordonnées).
// Le lien vers l'auteur est nommé : les favoris créent un 2e chemin entre annonces et profils, et Supabase refuse une jointure ambiguë.
export const SELECT_ANNONCE =
  "id, type, categorie, titre, description, contrepartie, lieu, quartier, tram, expire_le, statut, cree_le, auteur_id, auteur:profils!annonces_auteur_id_fkey(prenom, pseudo, campus, avatar_chemin, colette_couleur, colette_humeur, colette_accessoire, colette_motif), membres:annonce_membres(membre_id, statut, membre:profils!annonce_membres_membre_id_fkey(prenom, pseudo, avatar_chemin, colette_couleur, colette_humeur, colette_accessoire, colette_motif))";
// Post-its de groupe (0029) : les membres qui ont accepté sont visibles de tous ; une invitation en attente,
// seulement de l'invité et de l'équipe (RLS).

export type ProfilCourt = { prenom: string; pseudo: string; avatar_chemin: string | null; colette_couleur?: string; colette_humeur?: string; colette_accessoire?: string; colette_motif?: string };
export type MembreAnnonce = { membre_id: string; statut: "invite" | "accepte"; membre: ProfilCourt | null };

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
  auteur: { prenom: string; pseudo: string; campus: string; avatar_chemin: string | null; colette_couleur?: string; colette_humeur?: string; colette_accessoire?: string; colette_motif?: string } | null;
  membres?: MembreAnnonce[];
};

export function dateCourte(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(iso));
}
