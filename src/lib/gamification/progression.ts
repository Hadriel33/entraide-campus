// Gamification calculée à partir de faits protégés en base (annonces, demandes acceptées, avis).
// Rien n'est stocké ni modifiable par l'utilisateur : impossible de s'attribuer des points.

export type Stats = {
  annonces: number; // annonces publiées (actuelles et archivées)
  categories: number; // catégories différentes
  aides_donnees: number; // mises en relation acceptées où j'apporte l'aide
  aides_recues: number; // mises en relation acceptées où je reçois l'aide
  croisements: number; // entraides avec un étudiant de l'autre école
  nb_avis: number;
  note_moyenne: number | null;
};

export const BAREME = {
  annonce: 5,
  annoncesPlafond: 10, // au-delà, publier ne rapporte plus rien (anti-spam)
  aideDonnee: 30,
  aideRecue: 10,
  croisement: 10,
  avisRecu: 5,
} as const;

export const NIVEAUX = [
  { nom: "Nouveau", min: 0 },
  { nom: "Curieux", min: 25 },
  { nom: "Coup de main", min: 80 },
  { nom: "Pilier du campus", min: 200 },
  { nom: "Légende du campus", min: 400 },
] as const;

type Badge = { code: string; nom: string; description: string; obtenu: boolean };

export function calculerPoints(s: Stats) {
  return (
    Math.min(s.annonces, BAREME.annoncesPlafond) * BAREME.annonce +
    s.aides_donnees * BAREME.aideDonnee +
    s.aides_recues * BAREME.aideRecue +
    s.croisements * BAREME.croisement +
    s.nb_avis * BAREME.avisRecu
  );
}

export function calculerProgression(s: Stats) {
  const points = calculerPoints(s);
  const index = NIVEAUX.findLastIndex((n) => points >= n.min);
  const niveau = NIVEAUX[index];
  const suivant = NIVEAUX[index + 1] ?? null;
  const progression = suivant ? Math.round(((points - niveau.min) / (suivant.min - niveau.min)) * 100) : 100;

  const badges: Badge[] = [
    { code: "premiere_annonce", nom: "Première annonce", description: "Publier une annonce", obtenu: s.annonces >= 1 },
    { code: "premier_coup_de_main", nom: "Premier coup de main", description: "Aider un étudiant une première fois", obtenu: s.aides_donnees >= 1 },
    { code: "croisement", nom: "ESD × ESP", description: "S'entraider avec un étudiant de l'autre école", obtenu: s.croisements >= 1 },
    { code: "polyvalent", nom: "Polyvalent", description: "Publier dans 3 catégories différentes", obtenu: s.categories >= 3 },
    { code: "bien_entoure", nom: "Bien entouré", description: "Recevoir 5 coups de main", obtenu: s.aides_recues >= 5 },
    { code: "bien_note", nom: "Bien noté", description: "3 avis ou plus, avec une moyenne de 4,5 minimum", obtenu: s.nb_avis >= 3 && (s.note_moyenne ?? 0) >= 4.5 },
    { code: "pilier", nom: "Pilier du campus", description: "Aider 10 étudiants", obtenu: s.aides_donnees >= 10 },
  ];

  return { points, niveau, suivant, progression: Math.min(100, Math.max(0, progression)), badges };
}
