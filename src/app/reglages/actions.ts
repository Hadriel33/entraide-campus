"use server";

import { revalidatePath } from "next/cache";
import { exigerSession } from "@/lib/session";
import { validerSuggestion } from "@/lib/suggestions/validation";

export type EtatSuggestion = { ok?: boolean; erreur?: string; texte?: string };

// Boîte à suggestions : la base vérifie aussi l'auteur (RLS) et la limite de 5 par jour (migration 0038).
export async function envoyerSuggestion(_: EtatSuggestion, formData: FormData): Promise<EtatSuggestion> {
  const { supabase } = await exigerSession();
  const v = validerSuggestion({ categorie: formData.get("categorie"), texte: formData.get("texte") });
  const texte = String(formData.get("texte") ?? "");
  if (!v.ok) return { erreur: v.erreur, texte };
  const { error } = await supabase.from("suggestions").insert(v.valeurs);
  if (error?.code === "P0429") return { erreur: "Limite atteinte : 5 suggestions par jour. Merci, on lit tout !", texte };
  if (error) {
    console.error("Suggestion", error);
    return { erreur: "Pas envoyé, réessaie dans un instant.", texte };
  }
  revalidatePath("/reglages");
  return { ok: true };
}
