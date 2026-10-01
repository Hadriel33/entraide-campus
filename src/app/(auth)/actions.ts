"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validerConnexion, validerInscription } from "@/lib/auth/validation";

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
  console.error("Erreur Supabase Auth", code, message);
  return "Une erreur est survenue. Réessaie.";
}

export async function inscrire(_: EtatFormulaire, formData: FormData): Promise<EtatFormulaire> {
  const champs = {
    email: texte(formData, "email").trim(),
    motDePasse: texte(formData, "motDePasse"),
    prenom: texte(formData, "prenom").trim(),
    ecole: texte(formData, "ecole"),
  };
  const valeurs = { email: champs.email, prenom: champs.prenom, ecole: champs.ecole };

  const validation = validerInscription(champs);
  if (!validation.ok) return { erreurs: validation.erreurs, valeurs };

  const origine = (await headers()).get("origin") ?? "https://entraide-campus.vercel.app";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: champs.email,
    password: champs.motDePasse,
    options: {
      data: { prenom: champs.prenom, ecole: champs.ecole },
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
  redirect("/compte");
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

  redirect("/compte");
}

export async function deconnecter() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
