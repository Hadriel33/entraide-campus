// Le côté réseau social : réactions sous les posts, salons de discussion du campus.
// La sécurité est en base (migration 0025) ; ici, seulement la mise en forme.

export const REACTIONS = [
  { type: "bravo", label: "Bravo" },
  { type: "feu", label: "Trop bien" },
  { type: "merci", label: "Merci" },
  { type: "mdr", label: "Mdr" },
] as const;
export type TypeReaction = (typeof REACTIONS)[number]["type"];

// Les « emoji » de l'appli : une tête de Colette par réaction (dessinée, jamais d'emoji : règle front-portable).
export const COLETTE_REACTION: Record<TypeReaction, { humeur: "fiere" | "contente" | "rit"; accessoire: "aucun" | "flamme" | "lunettes_coeur" }> = {
  bravo: { humeur: "fiere", accessoire: "aucun" },
  feu: { humeur: "contente", accessoire: "flamme" },
  merci: { humeur: "contente", accessoire: "lunettes_coeur" },
  mdr: { humeur: "rit", accessoire: "aucun" },
};
export type ResumeReactions = Record<TypeReaction, { n: number; moi: boolean }>;

const vide = (): ResumeReactions => ({
  bravo: { n: 0, moi: false },
  feu: { n: 0, moi: false },
  merci: { n: 0, moi: false },
  mdr: { n: 0, moi: false },
});

export function resumerReactions(lignes: { cible_id: string; type: string; auteur_id: string }[], moi: string) {
  const parCible = new Map<string, ResumeReactions>();
  for (const l of lignes) {
    const r = parCible.get(l.cible_id) ?? vide();
    parCible.set(l.cible_id, r);
    if (!(l.type in r)) continue;
    const t = r[l.type as TypeReaction];
    t.n += 1;
    if (l.auteur_id === moi) t.moi = true;
  }
  return parCible;
}

export function reactionsVides() {
  return vide();
}

// Mes salons : le général, celui de mon campus, et celui de ma classe si j'en ai une.
export type Salon = { id: string; nom: string };

export function salonsDe({ campus, classe }: { campus: string; classe: { id: string; nom: string } | null }): Salon[] {
  return [
    { id: "general", nom: "Général" },
    { id: `campus:${campus}`, nom: `Campus de ${campus}` },
    ...(classe ? [{ id: `classe:${classe.id}`, nom: classe.nom }] : []),
  ];
}

// Les salons par thème (migration 0033) : ouverts à tous les étudiants, tous campus confondus.
export const SALONS_THEMES: Salon[] = [
  { id: "theme:photo-video", nom: "Photo et vidéo" },
  { id: "theme:dev", nom: "Dev et no-code" },
  { id: "theme:design", nom: "Design et UX" },
  { id: "theme:data-ia", nom: "Data et IA" },
  { id: "theme:logement", nom: "Coloc et covoit" },
];

export function tousLesSalons(moi: { campus: string; classe: { id: string; nom: string } | null }): Salon[] {
  return [...salonsDe(moi), ...SALONS_THEMES];
}

export function nomSalon(id: string, nomClasse?: string) {
  if (id === "general") return "Général";
  const theme = SALONS_THEMES.find((s) => s.id === id);
  if (theme) return theme.nom;
  if (id.startsWith("campus:")) return `Campus de ${id.slice(7)}`;
  return nomClasse ?? "Ma classe";
}
