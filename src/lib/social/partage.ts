// Partager un post-it dans un salon ou une discussion (migration 0033). La base vérifie aussi :
// le post-it doit m'être visible, le salon doit être le mien, la discussion doit me concerner.
import { CAMPUS } from "@/lib/auth/validation";
import { SALONS_THEMES } from "./social";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MOT_MAX = 300;

function salonConnu(id: string) {
  return (
    id === "general" ||
    SALONS_THEMES.some((s) => s.id === id) ||
    (id.startsWith("campus:") && (CAMPUS as readonly string[]).includes(id.slice(7))) ||
    (id.startsWith("classe:") && UUID.test(id.slice(7)))
  );
}

export function validerPartage(brut: { annonce: unknown; destination: unknown; mot: unknown }) {
  const annonce = String(brut.annonce ?? "");
  const destination = String(brut.destination ?? "");
  const mot = String(brut.mot ?? "").trim();
  if (!UUID.test(annonce) || mot.length > MOT_MAX) return null;
  if (destination.startsWith("salon:")) {
    const cible = destination.slice(6);
    return salonConnu(cible) ? { annonce, type: "salon" as const, cible, mot } : null;
  }
  if (destination.startsWith("discussion:")) {
    const cible = destination.slice(11);
    return UUID.test(cible) ? { annonce, type: "discussion" as const, cible, mot } : null;
  }
  return null;
}
