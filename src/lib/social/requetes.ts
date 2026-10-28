import type { SupabaseClient } from "@supabase/supabase-js";
import { reactionsVides, resumerReactions, type ResumeReactions } from "./social";
import { resumerSoutiens, type ResumeSoutien } from "./soutiens";

export type Commentaire = {
  id: string;
  cible_id: string;
  auteur_id: string;
  contenu: string;
  cree_le: string;
  auteur: { pseudo: string; avatar_chemin: string | null; colette_couleur?: string; colette_humeur?: string; colette_accessoire?: string; colette_motif?: string } | null;
};

// Réactions, commentaires (et soutiens pour une annonce) d'une liste de posts. La RLS ne renvoie que les posts visibles.
export async function chargerSocial(supabase: SupabaseClient, cible: "annonce" | "entraide", ids: string[], moi: string) {
  if (ids.length === 0) return { reactions: new Map<string, ResumeReactions>(), commentaires: new Map<string, Commentaire[]>(), soutiens: new Map<string, ResumeSoutien>() };
  const [{ data: reactions }, { data: commentaires }, { data: soutiens }] = await Promise.all([
    supabase.from("reactions").select("cible_id, type, auteur_id").eq("cible_type", cible).in("cible_id", ids),
    supabase
      .from("commentaires")
      .select("id, cible_id, auteur_id, contenu, cree_le, auteur:profils!commentaires_auteur_id_fkey(pseudo, avatar_chemin, colette_couleur, colette_humeur, colette_accessoire, colette_motif)")
      .eq("cible_type", cible)
      .in("cible_id", ids)
      .order("cree_le", { ascending: true })
      .limit(500),
    cible === "annonce"
      ? supabase.from("soutiens").select("annonce_id, auteur_id").in("annonce_id", ids).limit(5000)
      : Promise.resolve({ data: [] as { annonce_id: string; auteur_id: string }[] }),
  ]);
  const parCible = new Map<string, Commentaire[]>();
  for (const c of (commentaires ?? []) as unknown as Commentaire[]) {
    parCible.set(c.cible_id, [...(parCible.get(c.cible_id) ?? []), c]);
  }
  const resume = resumerReactions(reactions ?? [], moi);
  for (const id of ids) if (!resume.has(id)) resume.set(id, reactionsVides());
  return { reactions: resume, commentaires: parCible, soutiens: resumerSoutiens(soutiens ?? [], moi) };
}
