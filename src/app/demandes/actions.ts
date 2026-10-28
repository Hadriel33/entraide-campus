"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { validerAvis } from "@/lib/profils/validation";

const MOTIFS = [
  "arnaque",
  "inapproprie",
  "coordonnees",
  "hors_sujet",
  "autre",
] as const;

function texte(formData: FormData, cle: string, max: number) {
  return (
    String(formData.get(cle) ?? "")
      .trim()
      .slice(0, max) || null
  );
}

// Le destinataire et le demandeur sont fixés par la base (trigger), pas par ce code.
export async function demanderContact(annonceId: string, formData: FormData) {
  const { supabase } = await exigerSession();
  const { error } = await supabase.from("demandes_contact").insert({
    annonce_id: annonceId,
    message: texte(formData, "message", 300),
  });
  if (error?.code === "P0429") redirect(`/annonces/${annonceId}?ok=limite`); // limite anti-spam
  if (error && error.code !== "23505")
    console.error("Demande de contact", error); // 23505 = déjà demandé : on ignore
  revalidatePath(`/annonces/${annonceId}`);
  redirect(`/annonces/${annonceId}?ok=demande`);
}

export async function annulerDemande(demandeId: string, annonceId: string) {
  const { supabase } = await exigerSession();
  await supabase.from("demandes_contact").delete().eq("id", demandeId);
  revalidatePath("/demandes");
  redirect(`/annonces/${annonceId}?ok=annulee`);
}

// Répondre, une seule fois : le destinataire, ou n'importe qui de l'équipe d'un post-it de groupe.
// La fonction en base (0029) vérifie l'équipe ; celui qui accepte devient le destinataire (seules SES coordonnées sont montrées).
export async function repondreDemande(
  demandeId: string,
  reponse: "acceptee" | "refusee",
) {
  const { supabase } = await exigerSession();
  await supabase.rpc("repondre_demande", { p_demande: demandeId, p_accepter: reponse === "acceptee" });
  revalidatePath("/demandes");
  revalidatePath("/", "layout");
  // Acceptée : la fenêtre de discussion s'ouvre directement.
  redirect(
    reponse === "acceptee"
      ? `/demandes/${demandeId}?ok=acceptee`
      : `/demandes?ok=refusee`,
  );
}

// Plusieurs intéressés : je choisis l'un d'eux. « fermer » refuse les autres demandes en attente sur la même
// annonce et l'archive (elle quitte le mur). Chaque écriture passe par la RLS et les triggers habituels :
// je ne peux répondre qu'aux demandes qui me sont adressées, et n'archiver que mes annonces.
export async function choisirDemande(demandeId: string, fermer: boolean) {
  const { supabase, user } = await exigerSession();
  // La RLS ne renvoie que les demandes que je peux lire (destinataire ou équipe du post-it).
  const { data: choisie } = await supabase
    .from("demandes_contact")
    .select("id, annonce_id")
    .eq("id", demandeId)
    .eq("statut", "en_attente")
    .maybeSingle();
  if (!choisie) redirect("/demandes");

  const { error } = await supabase.rpc("repondre_demande", { p_demande: demandeId, p_accepter: true });
  if (error) redirect("/demandes");
  if (fermer) {
    const { data: autres } = await supabase
      .from("demandes_contact")
      .select("id")
      .eq("annonce_id", choisie.annonce_id)
      .eq("statut", "en_attente")
      .neq("id", demandeId)
      .neq("demandeur_id", user.id);
    for (const d of autres ?? []) await supabase.rpc("repondre_demande", { p_demande: d.id, p_accepter: false });
    // Archiver : le créateur ou un membre (RLS).
    await supabase.from("annonces").update({ statut: "archivee" }).eq("id", choisie.annonce_id);
  }
  revalidatePath("/demandes");
  revalidatePath("/", "layout");
  redirect(`/demandes/${demandeId}?ok=${fermer ? "choisi" : "acceptee"}`);
}

export async function laisserAvis(
  demandeId: string,
  retour: string,
  formData: FormData,
) {
  const { supabase } = await exigerSession();
  const validation = validerAvis({
    note: String(formData.get("note") ?? ""),
    commentaire: String(formData.get("commentaire") ?? ""),
  });
  if (!validation.ok) redirect(`${retour}?erreur=avis`);
  // La cible et l'auteur sont imposés par la base, qui vérifie aussi que la mise en relation est acceptée.
  await supabase.from("avis").insert({
    demande_id: demandeId,
    cible_id: "00000000-0000-0000-0000-000000000000",
    ...validation.valeurs,
  });
  revalidatePath(retour);
  redirect(`${retour}?ok=avis`);
}

export async function signalerAnnonce(annonceId: string, formData: FormData) {
  const { supabase } = await exigerSession();
  const motif = String(formData.get("motif") ?? "");
  if (!(MOTIFS as readonly string[]).includes(motif))
    redirect(`/annonces/${annonceId}`);
  await supabase.from("signalements").insert({
    annonce_id: annonceId,
    motif,
    details: texte(formData, "details", 300),
  });
  redirect(`/annonces/${annonceId}?ok=signalement`);
}
