"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validerAnnonce } from "@/lib/annonces/validation";

export type EtatAnnonce = {
  erreurs?: Partial<Record<string, string>>;
  message?: string;
  valeurs?: Record<string, string>;
};

const CHAMPS = ["type", "categorie", "titre", "description", "contrepartie", "lieu"] as const;

function lireChamps(formData: FormData) {
  return Object.fromEntries(CHAMPS.map((c) => [c, String(formData.get(c) ?? "")])) as Record<(typeof CHAMPS)[number], string>;
}

// Identité toujours vérifiée côté serveur, jamais lue dans le formulaire.
async function clientConnecte() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");
  return supabase;
}

export async function creerAnnonce(_: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  const champs = lireChamps(formData);
  const validation = validerAnnonce(champs);
  if (!validation.ok || !validation.valeurs) return { erreurs: validation.erreurs, valeurs: champs };

  const supabase = await clientConnecte();
  // auteur_id n'est pas envoyé : la base le remplit avec auth.uid(), et la RLS refuse tout autre auteur.
  const { data, error } = await supabase.from("annonces").insert(validation.valeurs).select("id").single();
  if (error || !data) {
    console.error("Création d'annonce", error);
    return { message: "L'annonce n'a pas pu être publiée. Réessaie.", valeurs: champs };
  }

  revalidatePath("/annonces");
  redirect(`/annonces/${data.id}`);
}

export async function modifierAnnonce(id: string, _: EtatAnnonce, formData: FormData): Promise<EtatAnnonce> {
  const champs = lireChamps(formData);
  const validation = validerAnnonce(champs);
  if (!validation.ok || !validation.valeurs) return { erreurs: validation.erreurs, valeurs: champs };

  const supabase = await clientConnecte();
  // La RLS ne laisse passer que l'auteur : 0 ligne modifiée = pas le droit (ou annonce disparue).
  const { data, error } = await supabase.from("annonces").update(validation.valeurs).eq("id", id).select("id");
  if (error || !data?.length) {
    return { message: "Modification impossible : cette annonce n'existe pas ou n'est pas la tienne.", valeurs: champs };
  }

  revalidatePath("/annonces");
  redirect(`/annonces/${id}`);
}

export async function changerStatut(id: string, statut: "publiee" | "archivee") {
  const supabase = await clientConnecte();
  await supabase.from("annonces").update({ statut }).eq("id", id);
  revalidatePath("/annonces");
  revalidatePath("/mes-annonces");
  redirect(`/annonces/${id}`);
}

export async function supprimerAnnonce(id: string) {
  const supabase = await clientConnecte();
  await supabase.from("annonces").delete().eq("id", id);
  revalidatePath("/annonces");
  revalidatePath("/mes-annonces");
  redirect("/mes-annonces");
}
