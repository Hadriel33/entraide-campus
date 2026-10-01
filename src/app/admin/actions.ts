"use server";

import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { exigerSession } from "@/lib/session";

// Vérification côté serveur, en plus de la RLS et des fonctions SQL qui refusent déjà un non-admin.
async function exigerAdmin() {
  const session = await exigerSession();
  if (session.profil.role !== "admin") notFound();
  return session;
}

export async function modererAnnonce(id: string, statut: "masquee" | "publiee") {
  const { supabase } = await exigerAdmin();
  await supabase.from("annonces").update({ statut }).eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin");
}

export async function supprimerAnnonceAdmin(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("annonces").delete().eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin");
}

export async function traiterSignalement(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("signalements").update({ statut: "traite" }).eq("id", id);
  revalidatePath("/admin");
  redirect("/admin");
}

export async function changerRole(cible: string, role: "admin" | "etudiant") {
  const { supabase } = await exigerAdmin();
  await supabase.rpc("definir_role", { cible, nouveau_role: role });
  revalidatePath("/admin");
  redirect("/admin?onglet=etudiants");
}

// Décision humaine sur une annonce passée par la modération IA : l'admin a toujours le dernier mot.
export async function validerModeration(id: string) {
  const { supabase } = await exigerAdmin();
  const { data } = await supabase.from("annonces").select("statut").eq("id", id).single();
  await supabase
    .from("annonces")
    .update({
      moderation: "ok",
      moderation_raisons: [],
      modere_le: new Date().toISOString(),
      ...(data?.statut === "masquee" ? { statut: "publiee" } : {}),
    })
    .eq("id", id);
  revalidatePath("/admin");
  revalidatePath("/annonces");
  redirect("/admin?ok=moderation");
}

// ---------- Classes (liste gérée par les admins, RLS : écriture admin uniquement) ----------

export async function creerClasse(formData: FormData) {
  const { supabase } = await exigerAdmin();
  const ecole = String(formData.get("ecole") ?? "");
  const nom = String(formData.get("nom") ?? "").trim().replace(/\s+/g, " ");
  if (!["ESD", "ESP"].includes(ecole) || nom.length < 2 || nom.length > 40) redirect("/admin?onglet=classes&erreur=classe");
  await supabase.from("classes").insert({ ecole, nom });
  revalidatePath("/admin");
  redirect("/admin?onglet=classes&ok=classe_creee");
}

export async function supprimerClasse(id: string) {
  const { supabase } = await exigerAdmin();
  await supabase.from("classes").delete().eq("id", id);
  revalidatePath("/admin");
  redirect("/admin?onglet=classes&ok=classe_supprimee");
}
