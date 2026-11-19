// Le suivi d'une entraide, façon colis : celui qui aide avance les étapes (« je monte la vidéo »), l'autre
// confirme « Bien reçu ». Colette fait la livreuse et change de tenue à chaque arrêt.
// La base applique les mêmes règles (fonctions avancer_entraide et confirmer_entraide, migration 0034).
import type { Accessoire, AnimColette, Humeur } from "@/components/colette/colette";
import { detecterCoordonnees } from "@/lib/ia/regles";

export type Etape = "parti" | "en_cours" | "presque" | "livre" | "recu";
export const MOT_MAX = 80;

type Look = { anim: AnimColette; humeur: Humeur; accessoire: Accessoire };

export const ETAPES: { code: Exclude<Etape, "recu">; label: string; phrase: string; colette: Look }[] = [
  { code: "parti", label: "C'est parti", phrase: "Colette boucle son sac.", colette: { anim: "saute", humeur: "contente", accessoire: "bob" } },
  { code: "en_cours", label: "Je m'y mets", phrase: "Colette a mis son casque : ça travaille.", colette: { anim: "tampon", humeur: "concentree", accessoire: "casque" } },
  { code: "presque", label: "Presque fini", phrase: "Colette transpire un peu, le bout est proche.", colette: { anim: "debordee", humeur: "concentree", accessoire: "bandana" } },
  { code: "livre", label: "C'est livré", phrase: "Colette sonne à la porte !", colette: { anim: "danse", humeur: "rit", accessoire: "ballon" } },
];
export const RECU = { label: "Bien reçu", phrase: "Colette repart toute fière.", colette: { anim: "coucou", humeur: "fiere", accessoire: "lunettes_coeur" } as Look };

const ORDRE: Etape[] = ["parti", "en_cours", "presque", "livre", "recu"];
export const rang = (e: Etape | null) => (e ? ORDRE.indexOf(e) : -1);

/** « Je propose » : l'auteur (ou son équipe) aide. « Je cherche » : celui qui a demandé le contact vient aider. */
export function jeSuisAide({ type, demandeurId, moi }: { type: "propose" | "cherche"; demandeurId: string; moi: string }) {
  return type === "propose" ? demandeurId !== moi : demandeurId === moi;
}

/** Les étapes que celui qui aide peut choisir : l'étape en cours (pour changer son mot) et les suivantes. */
export function etapesSuivantes(actuelle: Etape | null): Exclude<Etape, "recu">[] {
  if (actuelle === "livre" || actuelle === "recu") return [];
  return ETAPES.map((e) => e.code).filter((c) => rang(c) >= Math.max(rang(actuelle), 0));
}

export function validerAvancement({ actuelle, etape, mot }: { actuelle: Etape | null; etape: string; mot: string }) {
  const permises: string[] = etapesSuivantes(actuelle);
  if (!permises.includes(etape)) return null;
  const propre = mot.trim();
  if (propre.length > MOT_MAX || detecterCoordonnees(propre)) return null;
  return { etape: etape as Exclude<Etape, "recu">, mot: propre || null };
}

export function peutConfirmer({ etape, aide }: { etape: Etape | null; aide: boolean }) {
  return etape === "livre" && !aide;
}

export function colonneEchange({ statut, etape }: { statut: "en_attente" | "acceptee" | "refusee"; etape: Etape | null }) {
  if (statut === "en_attente") return "a_traiter";
  if (statut === "refusee") return "refusee";
  return etape === "recu" ? "termine" : "en_cours";
}
