import type { Stats } from "@/lib/gamification/progression";
import { ACCESSOIRES_COLETTE, MOTIFS_COLETTE, estDebloque } from "@/lib/profils/colette";

// « Colette gagne une tenue » : les pièces à gagner que j'ai gagnées, et celles qui ne sont pas encore fêtées.
export type PieceGagnee = { code: string; type: "accessoire" | "motif"; valeur: string; nom: string; aide: string };

export function piecesGagnees(stats: Stats | null): PieceGagnee[] {
  if (!stats) return [];
  const liste: PieceGagnee[] = [];
  for (const [type, pieces] of [["accessoire", ACCESSOIRES_COLETTE], ["motif", MOTIFS_COLETTE]] as const)
    for (const [valeur, o] of Object.entries(pieces))
      if (o.condition && estDebloque(o, stats)) liste.push({ code: `${type}:${valeur}`, type, valeur, nom: o.nom, aide: o.aide ?? "" });
  return liste;
}

// vues = codes déjà fêtés sur cet appareil ; null = première visite : on ne fête rien, on retient seulement.
export function nouvellesPieces(gagnees: string[], vues: string[] | null): string[] {
  if (!vues) return [];
  return gagnees.filter((c) => !vues.includes(c));
}
