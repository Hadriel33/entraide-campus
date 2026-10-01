import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProfilSession } from "@/lib/session";

// État réel du profil pour l'accueil guidé (photo, compétences, coordonnées, première annonce).
export async function lireEtatAccueil(supabase: SupabaseClient, profil: ProfilSession) {
  const [{ data: coordonnees }, { count }] = await Promise.all([
    supabase.from("coordonnees").select("telephone, reseau").eq("id", profil.id).maybeSingle(),
    supabase.from("annonces").select("id", { count: "exact", head: true }).eq("auteur_id", profil.id),
  ]);
  return {
    avatar: !!profil.avatar_chemin,
    competences: profil.competences?.length ?? 0,
    coordonnees: !!(coordonnees?.telephone || coordonnees?.reseau),
    annonces: count ?? 0,
  };
}
