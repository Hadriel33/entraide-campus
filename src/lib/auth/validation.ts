import { normaliserPseudo, validerPseudo } from "@/lib/profils/validation";

export const ECOLES = ["ESD", "ESP"] as const;
export type Ecole = (typeof ECOLES)[number];

export type Resultat<C extends string> = { ok: boolean; erreurs: Partial<Record<C, string>> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Seuls les emails de l'école sont acceptés, et l'école se déduit du domaine : impossible de mentir dessus.
// La même règle est imposée en base (trigger creer_profil, migration 0012).
export const DOMAINES_ECOLE: Record<string, Ecole> = { "mail-esd.com": "ESD", "mail-esp.com": "ESP" };

export function ecoleDepuisEmail(email: string): Ecole | null {
  const e = email.trim().toLowerCase();
  if (!EMAIL.test(e)) return null;
  return DOMAINES_ECOLE[e.slice(e.lastIndexOf("@") + 1)] ?? null;
}

export function validerInscription(champs: {
  email: string;
  motDePasse: string;
  prenom: string;
  pseudo: string;
}): Resultat<"email" | "motDePasse" | "prenom" | "pseudo"> & { ecole?: Ecole } {
  const erreurs: Resultat<"email" | "motDePasse" | "prenom" | "pseudo">["erreurs"] = {};
  const prenom = champs.prenom.trim();
  const ecole = ecoleDepuisEmail(champs.email);

  if (!EMAIL.test(champs.email.trim())) erreurs.email = "Adresse email invalide.";
  else if (!ecole) erreurs.email = "Utilise ton email de l'école : @mail-esd.com ou @mail-esp.com.";
  if (champs.motDePasse.length < 8) erreurs.motDePasse = "8 caractères minimum.";
  if (!prenom) erreurs.prenom = "Ton prénom est obligatoire.";
  else if (prenom.length > 40) erreurs.prenom = "40 caractères maximum.";
  const erreurPseudo = validerPseudo(normaliserPseudo(champs.pseudo));
  if (erreurPseudo) erreurs.pseudo = erreurPseudo;

  const ok = Object.keys(erreurs).length === 0;
  return ok && ecole ? { ok, erreurs, ecole } : { ok, erreurs };
}

export function validerConnexion(champs: {
  email: string;
  motDePasse: string;
}): Resultat<"email" | "motDePasse"> {
  const erreurs: Resultat<"email" | "motDePasse">["erreurs"] = {};
  if (!EMAIL.test(champs.email.trim())) erreurs.email = "Adresse email invalide.";
  if (!champs.motDePasse) erreurs.motDePasse = "Mot de passe obligatoire.";
  return { ok: Object.keys(erreurs).length === 0, erreurs };
}
