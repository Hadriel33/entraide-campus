// Colette s'habille toute seule selon le calendrier du campus (aucune donnée, juste la date).
export type TenueSaison = "cartable" | "sorciere" | "cafe" | "noel" | "bde";
export type Saison = { tenue: TenueSaison; nom: string; phrase: string };

// mois : 1 = janvier. Bornes incluses.
const CALENDRIER: { du: [number, number]; au: [number, number]; saison: Saison }[] = [
  { du: [9, 1], au: [9, 21], saison: { tenue: "cartable", nom: "Rentrée", phrase: "C'est la rentrée : nouveau cartable, nouvelles entraides !" } },
  { du: [10, 24], au: [10, 31], saison: { tenue: "sorciere", nom: "Halloween", phrase: "Bouh ! Même les sorcières ont besoin d'un coup de main." } },
  { du: [12, 8], au: [12, 20], saison: { tenue: "cafe", nom: "Partiels", phrase: "Partiels en vue : café, fiches et binômes de révision." } },
  { du: [12, 21], au: [12, 31], saison: { tenue: "noel", nom: "Noël", phrase: "Joyeuses fêtes ! Le mur reste ouvert pendant les vacances." } },
  { du: [1, 1], au: [1, 4], saison: { tenue: "bde", nom: "Nouvel an", phrase: "Bonne année ! Une bonne résolution : aider quelqu'un cette semaine." } },
  { du: [1, 5], au: [1, 20], saison: { tenue: "cafe", nom: "Partiels", phrase: "Partiels de janvier : courage, tu n'es pas seul." } },
  { du: [6, 1], au: [6, 20], saison: { tenue: "cafe", nom: "Partiels", phrase: "Derniers partiels avant l'été, on lâche rien." } },
  { du: [7, 1], au: [8, 31], saison: { tenue: "bde", nom: "Été", phrase: "C'est l'été : stages, jobs et colocs pour la rentrée." } },
];

export function saisonDu(date: Date): Saison | null {
  const v = (date.getMonth() + 1) * 100 + date.getDate();
  const ligne = CALENDRIER.find((c) => v >= c.du[0] * 100 + c.du[1] && v <= c.au[0] * 100 + c.au[1]);
  return ligne?.saison ?? null;
}
