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
  defis_reussis?: number; // défis de la semaine réussis (26 dernières semaines)
  aides_par_categorie?: Partial<Record<string, number>>; // pour les titres de spécialité
};

export const BAREME = {
  annonce: 5,
  annoncesPlafond: 10, // au-delà, publier ne rapporte plus rien (anti-spam)
  aideDonnee: 30,
  aideRecue: 10,
  croisement: 10,
  avisRecu: 5,
  defi: 20,
} as const;

export const NIVEAUX = [
  { nom: "Nouveau", min: 0 },
  { nom: "Curieux", min: 25 },
  { nom: "Coup de main", min: 80 },
  { nom: "Pilier du campus", min: 200 },
  { nom: "Légende du campus", min: 400 },
] as const;

// Un badge dit comment il s'obtient (« comment »), où on en est (actuel / objectif) et où aller pour progresser.
export type Badge = {
  code: string;
  nom: string;
  description: string;
  obtenu: boolean;
  actuel: number;
  objectif: number;
  comment: string;
  lien: string;
};

export function calculerPoints(s: Stats) {
  return (
    Math.min(s.annonces, BAREME.annoncesPlafond) * BAREME.annonce +
    s.aides_donnees * BAREME.aideDonnee +
    s.aides_recues * BAREME.aideRecue +
    s.croisements * BAREME.croisement +
    s.nb_avis * BAREME.avisRecu +
    (s.defis_reussis ?? 0) * BAREME.defi
  );
}

export function calculerProgression(s: Stats) {
  const points = calculerPoints(s);
  const index = NIVEAUX.findLastIndex((n) => points >= n.min);
  const niveau = NIVEAUX[index];
  const suivant = NIVEAUX[index + 1] ?? null;
  const progression = suivant
    ? Math.round(((points - niveau.min) / (suivant.min - niveau.min)) * 100)
    : 100;

  const note = s.note_moyenne ?? 0;
  const defis = s.defis_reussis ?? 0;
  const badge = (
    code: string,
    nom: string,
    description: string,
    actuel: number,
    objectif: number,
    comment: string,
    lien: string,
    obtenu = actuel >= objectif,
  ): Badge => ({
    code,
    nom,
    description,
    obtenu,
    actuel: Math.min(actuel, objectif),
    objectif,
    comment,
    lien,
  });
  const badges: Badge[] = [
    badge(
      "premiere_annonce",
      "Première annonce",
      "Publier une annonce",
      s.annonces,
      1,
      "Publie un post-it : ce que tu sais faire, ou ce que tu cherches.",
      "/annonces/nouvelle",
    ),
    badge(
      "premier_coup_de_main",
      "Premier coup de main",
      "Aider un étudiant une première fois",
      s.aides_donnees,
      1,
      "Accepte une demande sur une annonce où tu proposes ton aide, ou réponds à un « je cherche ».",
      "/annonces?type=cherche",
    ),
    badge(
      "croisement",
      "ESD × ESP",
      "S'entraider avec un étudiant de l'autre école",
      s.croisements,
      1,
      "Une entraide acceptée avec quelqu'un de l'autre école compte double au classement.",
      "/annonces",
    ),
    badge(
      "polyvalent",
      "Polyvalent",
      "Publier dans 3 catégories différentes",
      s.categories,
      3,
      "Publie dans 3 catégories différentes (photo, dev, coloc...).",
      "/annonces/nouvelle",
    ),
    badge(
      "bien_entoure",
      "Bien entouré",
      "Recevoir 5 coups de main",
      s.aides_recues,
      5,
      "Fais-toi aider 5 fois : demande le contact sur des annonces « je propose ».",
      "/annonces?type=propose",
    ),
    badge(
      "bien_note",
      "Bien noté",
      "3 avis ou plus, avec une moyenne de 4,5 minimum",
      s.nb_avis,
      3,
      "Reçois 3 avis avec une moyenne d'au moins 4,5. Après une entraide, chacun peut noter l'autre.",
      "/demandes",
      s.nb_avis >= 3 && note >= 4.5,
    ),
    badge(
      "pilier",
      "Pilier du campus",
      "Aider 10 étudiants",
      s.aides_donnees,
      10,
      "Aide 10 étudiants. Ça débloque aussi le diplôme et le motif doré de Colette.",
      "/annonces?type=cherche",
    ),
    badge(
      "defi",
      "Défi relevé",
      "Réussir un défi de la semaine",
      defis,
      1,
      "Réussis le défi de la semaine affiché sur ton bureau.",
      "/bureau",
    ),
    badge(
      "serie",
      "Régulier",
      "Réussir 4 défis de la semaine",
      defis,
      4,
      "Réussis 4 défis de la semaine (pas forcément d'affilée).",
      "/bureau",
    ),
  ];

  return {
    points,
    niveau,
    suivant,
    progression: Math.min(100, Math.max(0, progression)),
    badges,
  };
}
