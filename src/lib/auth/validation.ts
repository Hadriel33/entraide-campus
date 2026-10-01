export const ECOLES = ["ESD", "ESP"] as const;
export type Ecole = (typeof ECOLES)[number];

export type Resultat<C extends string> = { ok: boolean; erreurs: Partial<Record<C, string>> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validerInscription(champs: {
  email: string;
  motDePasse: string;
  prenom: string;
  ecole: string;
}): Resultat<"email" | "motDePasse" | "prenom" | "ecole"> {
  const erreurs: Resultat<"email" | "motDePasse" | "prenom" | "ecole">["erreurs"] = {};
  const prenom = champs.prenom.trim();

  if (!EMAIL.test(champs.email.trim())) erreurs.email = "Adresse email invalide.";
  if (champs.motDePasse.length < 8) erreurs.motDePasse = "8 caractères minimum.";
  if (!prenom) erreurs.prenom = "Ton prénom est obligatoire.";
  else if (prenom.length > 40) erreurs.prenom = "40 caractères maximum.";
  if (!ECOLES.includes(champs.ecole as Ecole)) erreurs.ecole = "Choisis ESD ou ESP.";

  return { ok: Object.keys(erreurs).length === 0, erreurs };
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
