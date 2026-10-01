"use server";

import { revalidatePath } from "next/cache";
import { exigerSession } from "@/lib/session";

export async function marquerToutLu() {
  const { supabase, user } = await exigerSession();
  await supabase.from("notifications").update({ lu: true }).eq("destinataire_id", user.id).eq("lu", false);
  revalidatePath("/", "layout");
}
