"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { validerPseudoInvite } from "@/lib/annonces/groupe";

export type EtatInvitation = { message?: string; ok?: boolean };

// Inviter un pote sur mon post-it. La base vérifie : je suis le créateur, 4 personnes au plus, pas moi-même.
export async function inviterMembre(annonceId: string, _: EtatInvitation, formData: FormData): Promise<EtatInvitation> {
  const pseudo = validerPseudoInvite(formData.get("pseudo"));
  if (!pseudo) return { message: "Écris le pseudo de ton pote, par exemple @sam.photo." };
  const { supabase, profil } = await exigerSession();
  if (pseudo === profil.pseudo) return { message: "Tu es déjà sur ce post-it." };
  const { data: cible } = await supabase.from("profils").select("id").eq("pseudo", pseudo).maybeSingle();
  if (!cible) return { message: `Personne ne s'appelle @${pseudo} sur l'appli.` };
  const { error } = await supabase.from("annonce_membres").insert({ annonce_id: annonceId, membre_id: cible.id });
  if (error) {
    if (error.code === "23505") return { message: `@${pseudo} est déjà invité.` };
    return { message: error.message.includes("4 personnes") ? "Un post-it de groupe, c'est 4 personnes au plus." : "Invitation impossible. Réessaie." };
  }
  revalidatePath(`/annonces/${annonceId}`);
  return { ok: true, message: `Invitation envoyée à @${pseudo}. Il apparaîtra sur le post-it quand il aura dit oui.` };
}

// L'invité dit oui : il rejoint le post-it (la base n'accepte que le passage « invite » vers « accepte »).
export async function rejoindreGroupe(annonceId: string) {
  const { supabase, user } = await exigerSession();
  const { error } = await supabase.from("annonce_membres").update({ statut: "accepte" }).eq("annonce_id", annonceId).eq("membre_id", user.id);
  revalidatePath(`/annonces/${annonceId}`);
  revalidatePath("/mes-annonces");
  if (!error) redirect(`/annonces/${annonceId}?ok=groupe#equipe`); // confettis : on fête l'équipe
}

// Refuser une invitation, quitter le groupe (moi), ou retirer quelqu'un (le créateur) : la RLS tranche.
export async function quitterGroupe(annonceId: string, membreId: string) {
  const { supabase } = await exigerSession();
  await supabase.from("annonce_membres").delete().eq("annonce_id", annonceId).eq("membre_id", membreId);
  revalidatePath(`/annonces/${annonceId}`);
  revalidatePath("/mes-annonces");
}
