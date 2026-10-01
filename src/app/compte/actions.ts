"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { normaliserPseudo, validerAvatar, validerCoordonnees, validerPseudo } from "@/lib/profils/validation";
import { extraireCompetences } from "@/lib/ia/modele";
import { nettoyerCompetences } from "@/lib/ia/regles";

export type EtatProfil = { erreurs?: Partial<Record<string, string>>; message?: string };

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export async function enregistrerProfil(_: EtatProfil, formData: FormData): Promise<EtatProfil> {
  const { supabase, user, profil } = await exigerSession();
  const pseudo = normaliserPseudo(String(formData.get("pseudo") ?? ""));
  const prenom = String(formData.get("prenom") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();

  const erreurs: EtatProfil["erreurs"] = {};
  const erreurPseudo = validerPseudo(pseudo);
  if (erreurPseudo) erreurs.pseudo = erreurPseudo;
  if (!prenom || prenom.length > 40) erreurs.prenom = "Entre 1 et 40 caractères.";
  if (bio.length > 160) erreurs.bio = "160 caractères maximum.";
  if (Object.keys(erreurs).length) return { erreurs };

  if (pseudo !== profil.pseudo) {
    const { data: libre } = await supabase.rpc("pseudo_disponible", { p: pseudo });
    if (!libre) return { erreurs: { pseudo: "Ce pseudo est déjà pris." } };
  }

  const { error } = await supabase.from("profils").update({ pseudo, prenom, bio: bio || null }).eq("id", user.id);
  if (error) return { message: "Enregistrement impossible. Réessaie." };
  revalidatePath("/", "layout");
  redirect("/compte?ok=profil");
}

export async function changerPhoto(_: EtatProfil, formData: FormData): Promise<EtatProfil> {
  const { supabase, user, profil } = await exigerSession();
  const fichier = formData.get("photo");
  if (!(fichier instanceof File)) return { erreurs: { photo: "Choisis une image." } };
  const erreur = validerAvatar(fichier);
  if (erreur) return { erreurs: { photo: erreur } };

  // Toujours dans MON dossier : la policy Storage et la contrainte de la table refusent tout autre chemin.
  const chemin = `${user.id}/${Date.now()}.${EXTENSIONS[fichier.type]}`;
  const { error } = await supabase.storage.from("avatars").upload(chemin, fichier, { contentType: fichier.type });
  if (error) return { message: "Envoi de la photo impossible. Réessaie." };

  await supabase.from("profils").update({ avatar_chemin: chemin }).eq("id", user.id);
  if (profil.avatar_chemin) await supabase.storage.from("avatars").remove([profil.avatar_chemin]);
  revalidatePath("/", "layout");
  redirect("/compte?ok=photo");
}

export async function enregistrerCoordonnees(_: EtatProfil, formData: FormData): Promise<EtatProfil> {
  const { supabase, user } = await exigerSession();
  const validation = validerCoordonnees({
    telephone: String(formData.get("telephone") ?? ""),
    email: String(formData.get("email") ?? ""),
    reseau: String(formData.get("reseau") ?? ""),
  });
  if (!validation.ok) return { erreurs: validation.erreurs };
  const { error } = await supabase.from("coordonnees").update(validation.valeurs).eq("id", user.id);
  if (error) return { message: "Enregistrement impossible. Réessaie." };
  redirect("/compte?ok=coordonnees");
}

// ---------- IA n°1 : compétences depuis le CV ----------

export type EtatCV = { propositions?: string[]; message?: string; erreur?: string };

// Le CV est lu en mémoire et transmis au modèle, puis oublié : il n'est jamais stocké.
export async function analyserCV(_: EtatCV, formData: FormData): Promise<EtatCV> {
  await exigerSession();
  const fichier = formData.get("cv");
  if (!(fichier instanceof File) || fichier.size === 0) return { erreur: "Choisis ton CV au format PDF." };
  if (fichier.type !== "application/pdf") return { erreur: "Le CV doit être un PDF." };
  if (fichier.size > 2 * 1024 * 1024) return { erreur: "2 Mo maximum." };

  const propositions = await extraireCompetences(new Uint8Array(await fichier.arrayBuffer()));
  if (propositions === null) {
    return { erreur: "L'IA ne répond pas pour l'instant. Tu peux ajouter tes compétences à la main juste en dessous." };
  }
  if (propositions.length === 0) {
    return { propositions, message: "Aucune compétence trouvée dans ce document. Ajoute-les à la main." };
  }
  return { propositions, message: "Voici ce que l'IA propose. Décoche ce qui ne te correspond pas, ajoute ce qui manque, puis enregistre." };
}

// Rien n'est enregistré sans le clic de l'étudiant : c'est lui qui valide la liste finale.
export async function enregistrerCompetences(competences: string[]) {
  const { supabase, user } = await exigerSession();
  await supabase.from("profils").update({ competences: nettoyerCompetences(competences) }).eq("id", user.id);
  revalidatePath("/compte");
  redirect("/compte?ok=competences");
}
