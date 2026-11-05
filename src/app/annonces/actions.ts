"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validerAnnonce } from "@/lib/annonces/validation";
import { programmerModeration } from "@/lib/ia/moderation";
import { redigerAnnonce } from "@/lib/ia/modele";
import type { Brouillon } from "@/lib/ia/regles";
import { cheminPhotoAnnonce, urlPhotoAnnonce, validerPhotoAnnonce } from "@/lib/annonces/photo";
import { pseudosAInviter } from "@/lib/annonces/groupe";

export type EtatAnnonce = {
  erreurs?: Partial<Record<string, string>>;
  message?: string;
  valeurs?: Record<string, string>;
};

const CHAMPS = ["type", "categorie", "titre", "description", "contrepartie", "lieu", "quartier", "tram"] as const;
// (« equipe », la liste des potes à inviter, est lue à part : elle ne va pas dans la table des annonces.)

function lireChamps(formData: FormData) {
  return Object.fromEntries(CHAMPS.map((c) => [c, String(formData.get(c) ?? "")])) as Record<(typeof CHAMPS)[number], string>;
}

// Identité toujours vérifiée côté serveur, jamais lue dans le formulaire.
async function clientConnecte() {
  return (await session()).supabase;
}
async function session() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return { supabase, user };
}

// La photo du formulaire (facultative) : validée ici, puis rangée dans MON dossier du bucket « annonces »
// (le bucket et la base vérifient aussi). Renvoie le chemin, null s'il n'y en a pas, ou une erreur.
async function envoyerPhoto(supabase: Awaited<ReturnType<typeof createClient>>, uid: string, formData: FormData) {
  const brut = formData.get("photo");
  const fichier = brut instanceof File ? brut : null;
  const v = validerPhotoAnnonce(fichier);
  if (!v.ok) return { erreur: v.erreur };
  if (!v.photo || !fichier) return { chemin: null };
  const chemin = cheminPhotoAnnonce(uid, fichier.type, crypto.randomUUID());
  const { error } = await supabase.storage.from("annonces").upload(chemin, fichier, { contentType: fichier.type });
  if (error) {
    console.error("Envoi de la photo", error);
    return { erreur: "La photo n'a pas pu être envoyée. Réessaie." };
  }
  return { chemin };
}

export async function creerAnnonce(_: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  const champs = lireChamps(formData);
  const validation = validerAnnonce(champs);
  if (!validation.ok || !validation.valeurs) return { erreurs: validation.erreurs, valeurs: champs };

  const { supabase, user } = await session();
  const photo = await envoyerPhoto(supabase, user.id, formData);
  if ("erreur" in photo) return { erreurs: { photo: photo.erreur }, valeurs: champs };
  // auteur_id n'est pas envoyé : la base le remplit avec auth.uid(), et la RLS refuse tout autre auteur.
  const { data, error } = await supabase
    .from("annonces")
    .insert({ ...validation.valeurs, ...(photo.chemin ? { photo_chemin: photo.chemin } : {}) })
    .select("id")
    .single();
  if (error || !data) {
    if (photo.chemin) await supabase.storage.from("annonces").remove([photo.chemin]);
    if (error?.code === "P0429") return { message: error.message, valeurs: champs }; // limite anti-spam
    console.error("Création d'annonce", error);
    return { message: "L'annonce n'a pas pu être publiée. Réessaie.", valeurs: champs };
  }

  // Post-it de groupe dès la publication : les potes indiqués sont invités (la base vérifie : 3 au plus,
  // seul le créateur invite). Un pseudo inconnu est simplement ignoré ; l'équipe se gère ensuite depuis la page.
  const equipe = pseudosAInviter(String(formData.get("equipe") ?? ""));
  if (equipe.length) {
    const { data: invites } = await supabase.from("profils").select("id").in("pseudo", equipe);
    for (const p of invites ?? []) if (p.id !== user.id) await supabase.from("annonce_membres").insert({ annonce_id: data.id, membre_id: p.id });
  }

  programmerModeration(data.id, { ...validation.valeurs, photoUrl: urlPhotoAnnonce(photo.chemin) });
  revalidatePath("/annonces");
  redirect(`/annonces/${data.id}?ok=publiee`);
}

export async function modifierAnnonce(id: string, _: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  const champs = lireChamps(formData);
  const validation = validerAnnonce(champs);
  if (!validation.ok || !validation.valeurs) return { erreurs: validation.erreurs, valeurs: champs };

  const { supabase, user } = await session();
  const { data: avant } = await supabase.from("annonces").select("photo_chemin").eq("id", id).maybeSingle();
  const photo = await envoyerPhoto(supabase, user.id, formData);
  if ("erreur" in photo) return { erreurs: { photo: photo.erreur }, valeurs: champs };
  // Nouvelle photo, photo retirée, ou on garde l'ancienne.
  const retirer = formData.get("retirer_photo") === "oui";
  const finale = photo.chemin ?? (retirer ? null : (avant?.photo_chemin ?? null));
  // La RLS ne laisse passer que l'auteur ou un membre du groupe : 0 ligne modifiée = pas le droit (ou annonce disparue).
  const { data, error } = await supabase
    .from("annonces")
    .update({ ...validation.valeurs, photo_chemin: finale })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) {
    if (photo.chemin) await supabase.storage.from("annonces").remove([photo.chemin]);
    return { message: "Modification impossible : cette annonce n'existe pas, ou tu n'es pas dans son équipe.", valeurs: champs };
  }
  // L'ancienne photo part (le bucket ne laisse supprimer que dans son propre dossier : sinon elle reste, sans lien).
  if (avant?.photo_chemin && avant.photo_chemin !== finale) await supabase.storage.from("annonces").remove([avant.photo_chemin]);

  programmerModeration(id, { ...validation.valeurs, photoUrl: urlPhotoAnnonce(finale) });
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?ok=modifiee`);
}

export async function changerStatut(id: string, statut: "publiee" | "archivee") {
  const supabase = await clientConnecte();
  await supabase.from("annonces").update({ statut }).eq("id", id);
  revalidatePath("/annonces");
  revalidatePath("/mes-annonces");
  redirect(`/annonces/${id}?ok=${statut === "archivee" ? "archivee" : "republiee"}`);
}

export async function supprimerAnnonce(id: string) {
  const supabase = await clientConnecte();
  const { data: avant } = await supabase.from("annonces").select("photo_chemin").eq("id", id).maybeSingle();
  const { data: supprimee } = await supabase.from("annonces").delete().eq("id", id).select("id");
  // Sa photo part avec lui (RGPD : rien ne traîne dans le bucket).
  if (supprimee?.length && avant?.photo_chemin) await supabase.storage.from("annonces").remove([avant.photo_chemin]);
  revalidatePath("/annonces");
  revalidatePath("/mes-annonces");
  redirect("/mes-annonces?ok=supprimee");
}

// Prolonger : seule la fonction SQL peut changer la date d'expiration, et seulement pour l'auteur.
export async function prolongerAnnonce(id: string) {
  const supabase = await clientConnecte();
  await supabase.rpc("prolonger_annonce", { p_annonce: id });
  revalidatePath("/mes-annonces");
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?ok=prolongee`);
}

// IA n°2 : l'auteur accepte la version corrigée proposée par Colette. On relit la proposition EN BASE
// (jamais depuis le formulaire), on l'applique, et la modération repart sur le nouveau texte.
export async function appliquerCorrection(id: string) {
  const supabase = await clientConnecte();
  const { data } = await supabase.from("annonces").select("moderation_suggestion, lieu").eq("id", id).maybeSingle();
  const s = data?.moderation_suggestion as { titre?: string; description?: string } | null | undefined;
  if (!s?.titre || !s?.description) redirect(`/annonces/${id}`);
  const { data: maj, error } = await supabase.from("annonces").update({ titre: s.titre, description: s.description }).eq("id", id).select("id");
  if (error || !maj?.length) redirect(`/annonces/${id}`);
  programmerModeration(id, { titre: s.titre, description: s.description, lieu: data?.lieu ?? null });
  revalidatePath("/annonces");
  redirect(`/annonces/${id}?ok=corrigee`);
}

// IA n°3 (bonus) : Colette rédige un brouillon à partir d'une phrase. Rien n'est publié : le brouillon
// remplit le formulaire, l'étudiant relit, corrige, puis publie lui-même (et la modération passe ensuite).
export type EtatRedaction = { brouillon?: Brouillon; erreur?: string; idee?: string };

export async function redigerAvecColette(_: EtatRedaction, formData: FormData): Promise<EtatRedaction> {
  await clientConnecte();
  const idee = String(formData.get("idee") ?? "").trim().slice(0, 400);
  if (idee.length < 10) return { erreur: "Dis-en un peu plus : au moins une phrase.", idee };
  const brouillon = await redigerAnnonce(idee);
  if (!brouillon) return { erreur: "Colette n'a pas réussi cette fois. Tu peux remplir le formulaire à la main juste en dessous.", idee };
  return { brouillon, idee };
}
