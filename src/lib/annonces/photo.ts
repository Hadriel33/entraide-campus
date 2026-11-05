// La photo d'un post-it (un objet à prêter, une chambre, un shooting). Mêmes règles que la photo de profil.
// La base et le bucket vérifient aussi (migration 0031) ; l'IA n°2 relit la photo avec le texte.
export const PHOTO_TYPES = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as const;
export const PHOTO_MAX = 2 * 1024 * 1024;

type Fichier = { type: string; size: number; name: string } | null | undefined;

export function validerPhotoAnnonce(f: Fichier): { ok: true; photo: boolean } | { ok: false; erreur: string } {
  if (!f || f.size === 0) return { ok: true, photo: false }; // aucun fichier choisi
  if (!(f.type in PHOTO_TYPES)) return { ok: false, erreur: "Photo en JPEG, PNG ou WebP." };
  if (f.size > PHOTO_MAX) return { ok: false, erreur: "Photo de 2 Mo maximum." };
  return { ok: true, photo: true };
}

export function cheminPhotoAnnonce(uid: string, type: string, id: string) {
  return `${uid}/${id}.${PHOTO_TYPES[type as keyof typeof PHOTO_TYPES] ?? "jpg"}`;
}

export function urlPhotoAnnonce(chemin: string | null | undefined) {
  if (!chemin) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/annonces/${chemin}`;
}

// Réduction dans le navigateur avant l'envoi : le plus grand côté à 1600 px (une photo de téléphone de 5 Mo
// descend autour de 300 Ko). Jamais d'agrandissement.
export const COTE_MAX = 1600;
export function dimensionsReduites(largeur: number, hauteur: number, max = COTE_MAX) {
  const r = Math.min(1, max / Math.max(largeur, hauteur));
  return { largeur: Math.round(largeur * r), hauteur: Math.round(hauteur * r) };
}
