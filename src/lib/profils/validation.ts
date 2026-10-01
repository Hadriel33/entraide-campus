const PSEUDO = /^[a-z0-9_](?:[a-z0-9._]{1,18})[a-z0-9_]$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEPHONE_FR = /^(?:0|\+33)[1-9]\d{8}$/;

export const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const AVATAR_TAILLE_MAX = 2 * 1024 * 1024;

export function normaliserPseudo(brut: string) {
  return brut.trim().replace(/^@/, "").toLowerCase();
}

// Renvoie un message d'erreur, ou undefined si le pseudo est valide (déjà normalisé).
export function validerPseudo(pseudo: string): string | undefined {
  if (pseudo.length < 3 || pseudo.length > 20) return "Entre 3 et 20 caractères.";
  if (!PSEUDO.test(pseudo)) return "Lettres minuscules sans accent, chiffres, point ou tiret bas. Pas de point au début ni à la fin.";
  return undefined;
}

export function validerCoordonnees(champs: { telephone: string; email: string; reseau: string }) {
  const erreurs: Partial<Record<"telephone" | "email" | "reseau" | "general", string>> = {};
  const telephone = champs.telephone.replace(/[\s.-]/g, "");
  const email = champs.email.trim();
  const reseau = champs.reseau.trim();

  if (telephone && !TELEPHONE_FR.test(telephone)) erreurs.telephone = "Numéro français attendu, par exemple 06 12 34 56 78.";
  if (email && !EMAIL.test(email)) erreurs.email = "Adresse email invalide.";
  if (reseau.length > 60) erreurs.reseau = "60 caractères maximum.";
  if (!telephone && !email && !reseau) erreurs.general = "Indique au moins un moyen de te contacter.";

  if (Object.keys(erreurs).length) return { ok: false as const, erreurs };
  return {
    ok: true as const,
    erreurs,
    valeurs: { telephone: telephone || null, email: email || null, reseau: reseau || null },
  };
}

export function validerAvis(champs: { note: string; commentaire: string }) {
  const erreurs: Partial<Record<"note" | "commentaire", string>> = {};
  const note = Number(champs.note);
  const commentaire = champs.commentaire.trim();
  if (!Number.isInteger(note) || note < 1 || note > 5) erreurs.note = "Choisis une note de 1 à 5.";
  if (commentaire.length > 300) erreurs.commentaire = "300 caractères maximum.";
  if (Object.keys(erreurs).length) return { ok: false as const, erreurs };
  return { ok: true as const, erreurs, valeurs: { note, commentaire: commentaire || null } };
}

export function validerAvatar(fichier: { type: string; size: number }): string | undefined {
  if (!(AVATAR_TYPES as readonly string[]).includes(fichier.type)) return "Format accepté : JPG, PNG ou WebP.";
  if (fichier.size === 0) return "Le fichier est vide.";
  if (fichier.size > AVATAR_TAILLE_MAX) return "2 Mo maximum.";
  return undefined;
}
