// Signaler un commentaire ou un message de salon (migration 0031) : les mêmes motifs qu'en base.
export const MOTIFS_SIGNALEMENT = {
  harcelement: "Harcèlement ou moquerie",
  inapproprie: "Contenu choquant ou déplacé",
  coordonnees: "Numéro ou email partagé",
  arnaque: "Arnaque ou demande d'argent",
  autre: "Autre chose",
} as const;
export type MotifSignalement = keyof typeof MOTIFS_SIGNALEMENT;
export type CibleSignalement = "commentaire" | "salon";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validerSignalementMessage(brut: { cible: unknown; id: unknown; motif: unknown }) {
  const cible = String(brut.cible ?? "");
  const id = String(brut.id ?? "");
  const motif = String(brut.motif ?? "");
  if (cible !== "commentaire" && cible !== "salon") return null;
  if (!UUID.test(id) || !(motif in MOTIFS_SIGNALEMENT)) return null;
  return { cible: cible as CibleSignalement, id, motif: motif as MotifSignalement };
}
