"use server";

import { revalidatePath } from "next/cache";
import { exigerSession } from "@/lib/session";
import { REACTIONS, type TypeReaction } from "@/lib/social/social";
import { detecterCoordonnees } from "@/lib/ia/regles";

type Cible = "annonce" | "entraide";

function chemin(cible: Cible, id: string) {
  return cible === "annonce" ? `/annonces/${id}` : "/fil";
}

// Réagir ou retirer sa réaction. La base refuse : un post invisible, son propre post, un doublon.
export async function basculerReaction(cible: Cible, id: string, type: TypeReaction, dejaMise: boolean) {
  if (!REACTIONS.some((r) => r.type === type)) return;
  const { supabase, user } = await exigerSession();
  if (dejaMise) await supabase.from("reactions").delete().eq("cible_type", cible).eq("cible_id", id).eq("auteur_id", user.id).eq("type", type);
  else await supabase.from("reactions").insert({ cible_type: cible, cible_id: id, type });
  revalidatePath(chemin(cible, id));
}

export type EtatCommentaire = { erreur?: string; ok?: number };

// Commenter : la base refuse aussi un numéro ou un email (règle d'or n°1) et le spam.
export async function commenter(_: EtatCommentaire, formData: FormData): Promise<EtatCommentaire> {
  const cible = formData.get("cible") === "entraide" ? "entraide" : "annonce";
  const id = String(formData.get("id") ?? "");
  const contenu = String(formData.get("contenu") ?? "").trim();
  if (!contenu) return { erreur: "Écris quelque chose." };
  if (contenu.length > 300) return { erreur: "300 caractères maximum." };
  if (detecterCoordonnees(contenu)) return { erreur: "Pas de numéro ni d'email en commentaire : passe par « Demander le contact »." };
  const { supabase } = await exigerSession();
  const { error } = await supabase.from("commentaires").insert({ cible_type: cible, cible_id: id, contenu });
  if (error) return { erreur: error.code === "P0429" ? "Tu commentes beaucoup : patiente quelques minutes." : "Commentaire impossible. Réessaie." };
  revalidatePath(chemin(cible, id));
  return { ok: Date.now() };
}

export async function supprimerCommentaire(commentaireId: string, cible: Cible, id: string) {
  const { supabase } = await exigerSession();
  await supabase.from("commentaires").delete().eq("id", commentaireId); // RLS : l'auteur ou un admin
  revalidatePath(chemin(cible, id));
}
