// Ce que Colette dit sur ton bureau : une phrase, la plus utile du moment. Pur calcul, testé.
export type ContexteColette = {
  classe: { nom: string; rang: number; ecart: number } | null; // ecart = points à gagner pour passer devant
  aUneClasse: boolean;
  rang: number; // rang de la semaine (0 = pas classé)
  ecartRang: number;
  defi: { titre: string; reussi: boolean } | null;
  phraseSaison: string | null;
  jour: number; // 0 = dimanche
};

const ASTUCES = [
  "Astuce : une annonce avec un quartier et une ligne de tram reçoit plus de réponses.",
  "Astuce : dépose ton CV dans ton profil, je te propose tes compétences en 10 secondes.",
  "Astuce : Ctrl + K pour aller n'importe où sans la souris.",
  "Astuce : aider quelqu'un de l'autre école rapporte un bonus croisement.",
  "Astuce : passe le mur en mode projection pour l'afficher en grand.",
  "Astuce : les tenues rares de ma garde-robe se gagnent en s'entraidant.",
  "Astuce : une annonce expire toute seule, pense à la prolonger.",
];

export function messageColette(c: ContexteColette): string {
  if (c.classe && c.classe.rang === 1) return `${c.classe.nom} est en tête des classes cette semaine ! On garde la place ?`;
  if (c.classe && c.classe.rang > 1 && c.classe.ecart > 0)
    return `${c.classe.nom} est ${c.classe.rang}e des classes : encore ${c.classe.ecart} point${c.classe.ecart > 1 ? "s" : ""} pour passer ${c.classe.rang - 1}e !`;
  if (c.rang > 1 && c.ecartRang > 0) return `Tu es ${c.rang}e cette semaine, à ${c.ecartRang} point${c.ecartRang > 1 ? "s" : ""} de la ${c.rang - 1}e place.`;
  if (c.rang === 1) return "Tu es premier du classement de la semaine. Respect.";
  if (!c.aUneClasse) return "Choisis ta classe dans ton profil : chaque coup de main la fera monter au classement.";
  if (c.defi && !c.defi.reussi) return `Défi de la semaine : ${c.defi.titre.toLowerCase()}. +20 points à la clé !`;
  if (c.phraseSaison) return c.phraseSaison;
  return ASTUCES[c.jour % ASTUCES.length];
}
