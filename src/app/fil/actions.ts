"use server";

import { revalidatePath } from "next/cache";
import { exigerSession } from "@/lib/session";
import { REACTIONS, nomSalon, type TypeReaction } from "@/lib/social/social";
import { detecterCoordonnees } from "@/lib/ia/regles";
import { contenuSticker, stickerDe } from "@/lib/messages/stickers";
import { validerSignalementMessage } from "@/lib/social/signalement";
import { validerPartage } from "@/lib/social/partage";

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
  const sticker = String(formData.get("sticker") ?? "");
  const contenu = stickerDe(contenuSticker(sticker)) ? contenuSticker(sticker) : String(formData.get("contenu") ?? "").trim();
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

// Soutenir un post-it (le faire monter) ou retirer son soutien. La base refuse : son propre post-it, un post-it caché, un doublon.
export async function basculerSoutien(annonceId: string, dejaSoutenu: boolean) {
  const { supabase, user } = await exigerSession();
  if (dejaSoutenu) await supabase.from("soutiens").delete().eq("annonce_id", annonceId).eq("auteur_id", user.id);
  else await supabase.from("soutiens").insert({ annonce_id: annonceId });
  revalidatePath(`/annonces/${annonceId}`);
}

// Signaler un commentaire ou un message de salon. La base vérifie : je peux le lire, ce n'est pas le mien,
// pas de doublon, pas plus de 20 par jour ; elle garde une copie pour l'admin.
export async function signalerMessage(cible: string, id: string, motif: string): Promise<{ ok: boolean; message: string }> {
  const v = validerSignalementMessage({ cible, id, motif });
  if (!v) return { ok: false, message: "Choisis un motif." };
  const { supabase } = await exigerSession();
  const { error } = await supabase.from("signalements_messages").insert({ cible_type: v.cible, cible_id: v.id, motif: v.motif });
  if (error && error.code !== "23505") return { ok: false, message: error.code === "P0429" ? error.message : "Signalement impossible. Réessaie." };
  return { ok: true, message: "Merci, l'équipe de modération va regarder." };
}

export type EtatPartage = { ok?: boolean; message?: string; lien?: string };

// Partager un post-it dans un salon ou une discussion. La base vérifie : post-it visible pour moi, salon à moi,
// discussion qui me concerne, pas de numéro ni d'email dans le petit mot, anti-spam.
export async function partagerPostit(_: EtatPartage, formData: FormData): Promise<EtatPartage> {
  const v = validerPartage({ annonce: formData.get("annonce"), destination: formData.get("destination"), mot: formData.get("mot") });
  if (!v) return { message: "Choisis où partager ce post-it." };
  if (v.mot && detecterCoordonnees(v.mot)) return { message: "Pas de numéro ni d'email : passe par « Demander le contact »." };
  const { supabase } = await exigerSession();
  const contenu = v.mot || "Je partage ce post-it";
  const { error } =
    v.type === "salon"
      ? await supabase.from("salon_messages").insert({ salon: v.cible, contenu, annonce_id: v.annonce })
      : await supabase.from("messages").insert({ demande_id: v.cible, contenu, annonce_id: v.annonce });
  if (error) return { message: error.code === "P0429" || error.code === "22023" ? error.message : "Partage impossible. Réessaie." };
  return v.type === "salon"
    ? { ok: true, message: `Partagé dans « ${nomSalon(v.cible)} ». Retrouve-le dans la bulle de Colette, onglet Salons.` }
    : { ok: true, message: "Partagé dans la discussion.", lien: `/demandes/${v.cible}` };
}
