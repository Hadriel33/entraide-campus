"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validerConnexion, validerInscription } from "@/lib/auth/validation";
import { normaliserPseudo } from "@/lib/profils/validation";

export type EtatFormulaire = {
  erreurs?: Partial<Record<string, string>>;
  message?: string;
  succes?: boolean;
  valeurs?: Record<string, string>;
};

function texte(formData: FormData, cle: string) {
  return String(formData.get(cle) ?? "");
}

// Messages Supabase traduits pour l'utilisateur. On ne révèle jamais si un email existe déjà.
function messageErreur(code: string | undefined, message: string) {
  if (code === "invalid_credentials") return "Email ou mot de passe incorrect.";
  if (code === "email_not_confirmed") return "Confirme d'abord ton email avec le lien reçu.";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit")
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (code === "weak_password") return "Mot de passe trop faible.";
  if (code === "email_provider_disabled" || code === "signup_disabled")
    return "Les inscriptions sont fermées pour le moment. Réessaie plus tard.";
  if (code === "email_address_not_authorized") return "Cette adresse ne peut pas recevoir d'email de confirmation pour le moment.";
  if (code === "user_already_exists" || code === "email_exists") return "Un compte existe déjà avec cet email : connecte-toi.";
  console.error("Erreur Supabase Auth", code, message);
  return "Une erreur est survenue. Réessaie.";
}

export async function inscrire(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const champs = {
    email: texte(formData, "email").trim(),
    motDePasse: texte(formData, "motDePasse"),
    prenom: texte(formData, "prenom").trim(),
    pseudo: normaliserPseudo(texte(formData, "pseudo")),
  };
  const valeurs = { email: champs.email, prenom: champs.prenom, pseudo: champs.pseudo };

  const validation = validerInscription(champs);
  if (!validation.ok) return { erreurs: validation.erreurs, valeurs };

  const origine = (await headers()).get("origin") ?? "https://entraide-campus.vercel.app";
  const supabase = await createClient();
  const { data: libre } = await supabase.rpc("pseudo_disponible", { p: champs.pseudo });
  if (libre === false) return { erreurs: { pseudo: "Ce pseudo est déjà pris." }, valeurs };

  const { data, error } = await supabase.auth.signUp({
    email: champs.email,
    password: champs.motDePasse,
    options: {
      data: { prenom: champs.prenom, pseudo: champs.pseudo }, // l'école est déduite de l'email par la base
      emailRedirectTo: `${origine}/auth/confirmer`,
    },
  });

  if (error) return { message: messageErreur(error.code, error.message), valeurs };

  // Confirmation d'email activée : pas de session tant que le lien n'est pas cliqué.
  if (!data.session) {
    return {
      succes: true,
      message: `Presque fini : on t'a envoyé un lien de confirmation à ${champs.email}.`,
    };
  }
  redirect("/bienvenue?ok=bienvenue");
}

export async function connecter(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const champs = { email: texte(formData, "email").trim(), motDePasse: texte(formData, "motDePasse") };
  const valeurs = { email: champs.email };

  const validation = validerConnexion(champs);
  if (!validation.ok) return { erreurs: validation.erreurs, valeurs };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: champs.email,
    password: champs.motDePasse,
  });
  if (error) return { message: messageErreur(error.code, error.message), valeurs };

  redirect("/annonces");
}

export async function deconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------- Mot de passe oublié ----------

// Réponse identique que le compte existe ou non : on ne révèle pas quels emails sont inscrits.
export async function demanderReinitialisation(formData: FormData) {
  const email = texte(formData, "email").trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const origine = (await headers()).get("origin") ?? "https://entraide-campus.vercel.app";
    const supabase = await createClient();
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origine}/auth/confirmer?suite=mot-de-passe` });
  }
  redirect("/connexion?ok=lien_envoye");
}

export async function changerMotDePasse(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const motDePasse = texte(formData, "motDePasse");
  if (motDePasse.length < 8) return { erreurs: { motDePasse: "8 caractères minimum." } };
  if (motDePasse !== texte(formData, "confirmation")) return { erreurs: { confirmation: "Les deux mots de passe ne sont pas identiques." } };
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: motDePasse });
  if (error) return { message: messageErreur(error.code, error.message) };
  redirect("/compte?ok=mot_de_passe");
}
