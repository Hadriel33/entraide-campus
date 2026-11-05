import type { Humeur } from "@/components/colette/colette";

// Colette réagit une seconde à mes gestes : un mot, une humeur. Pas de point, pas de fenêtre à fermer.
export const GESTES = ["soutien", "reaction", "commentaire"] as const;
export type Geste = (typeof GESTES)[number];

const PHRASES: Record<Geste, string[]> = {
  soutien: ["Bien vu, ça monte !", "Un coup de pouce, ça compte", "Tu le fais grimper !"],
  reaction: ["Ça fait plaisir !", "Le campus te voit", "Joli !"],
  commentaire: ["Le campus te dit merci", "Bien envoyé !", "Ça discute, j'adore"],
};
export const HUMEUR_GESTE: Record<Geste, Humeur> = { soutien: "fiere", reaction: "contente", commentaire: "surprise" };

export function phraseReaction(geste: Geste, n: number) {
  const p = PHRASES[geste];
  return p[Math.abs(n) % p.length];
}

// Lancer la réaction depuis n'importe quel composant client.
export const EVENEMENT_REACTION = "colette-reagit";
export function faireReagirColette(geste: Geste) {
  window.dispatchEvent(new CustomEvent(EVENEMENT_REACTION, { detail: geste }));
}
