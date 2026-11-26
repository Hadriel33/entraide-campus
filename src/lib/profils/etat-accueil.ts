import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfilSession } from "@/lib/session";

// État réel du profil pour l'accueil guidé (photo ou Colette, compétences, coordonnées, premier post-it).
export async function lireEtatAccueil(supabase: SupabaseClient, profil: ProfilSession) {
  const [{ data: coordonnees }, { count }] = await Promise.all([
    supabase.from("coordonnees").select("telephone, reseau").eq("id", profil.id).maybeSingle(),
    supabase.from("annonces").select("id", { count: "exact", head: true }).eq("auteur_id", profil.id),
  ]);
  return {
    avatar: !!profil.avatar_chemin,
    // Une couleur choisie = Colette personnalisée (vide = celle donnée par défaut d'après le pseudo).
    colette: !!profil.colette_couleur,
    competences: profil.competences?.length ?? 0,
    coordonnees: !!(coordonnees?.telephone || coordonnees?.reseau),
    annonces: count ?? 0,
  };
}
