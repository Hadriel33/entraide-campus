"use server";

import { revalidatePath } from "next/cache";
import { exigerSession } from "@/lib/session";

// Favoris privés : la RLS garantit que chacun ne lit et ne modifie que les siens.
export async function basculerFavori(annonceId: string, dejaFavori: boolean) {
  const { supabase, user } = await exigerSession();
  if (dejaFavori) await supabase.from("favoris").delete().eq("profil_id", user.id).eq("annonce_id", annonceId);
  else await supabase.from("favoris").insert({ annonce_id: annonceId });
  revalidatePath(`/annonces/${annonceId}`);
  revalidatePath("/favoris");
}
