// Le parcours d'arrivée : les mêmes étapes, dans le même ordre, sur la page Bienvenue, le bureau et Mon profil.
// Calculé à partir de l'état réel du profil. Ta tête : une photo OU une Colette personnalisée (retour du 26/11 :
// on n'impose pas la photo).

/** Les sections de Mon profil, dans l'ordre. La classe est facultative (elle n'est pas dans la checklist). */
export const ETAPES_PROFIL = [
  { id: "tete", titre: "Ma tête" },
  { id: "competences", titre: "Mes compétences" },
  { id: "coordonnees", titre: "Mes coordonnées" },
  { id: "classe", titre: "Ma classe" },
] as const;

/** Le bouton « Étape suivante » en bas de chaque section ; après la dernière, le premier post-it. */
export function etapeSuivante(id: string): { href: string; label: string } | null {
  const i = ETAPES_PROFIL.findIndex((e) => e.id === id);
  if (i < 0) return null;
  const suivante = ETAPES_PROFIL[i + 1];
  if (!suivante) return { href: "/annonces/nouvelle", label: "C'est prêt : publier mon premier post-it" };
  return { href: `#${suivante.id}`, label: `Étape suivante : ${suivante.titre.toLowerCase()}` };
}

/** Un titre d'étape transformé en bouton (« Commencer : choisis ta tête… ») : seule la première lettre passe en minuscule. */
export function versAction(titre: string) {
  return titre.charAt(0).toLowerCase() + titre.slice(1);
}

export function etapesAccueil(etat: { avatar: boolean; colette?: boolean; competences: number; coordonnees: boolean; annonces: number }) {
  const etapes = [
    {
      code: "tete",
      titre: "Choisis ta tête : une photo ou ta Colette",
      aide: "Au choix. Ta Colette se crée en trois clics et te représente partout.",
      fait: etat.avatar || !!etat.colette,
      lien: "/compte#tete",
    },
    { code: "competences", titre: "Remplis tes compétences avec ton CV", aide: "L'IA lit ton CV et propose, tu valides.", fait: etat.competences > 0, lien: "/compte#competences" },
    { code: "coordonnees", titre: "Indique comment te joindre", aide: "Téléphone ou réseau : visible seulement après ton accord.", fait: etat.coordonnees, lien: "/compte#coordonnees" },
    { code: "annonce", titre: "Publie ton premier post-it", aide: "Ce que tu proposes, ou ce que tu cherches.", fait: etat.annonces > 0, lien: "/annonces/nouvelle" },
  ];
  const faites = etapes.filter((e) => e.fait).length;
  return { etapes, faites, termine: faites === etapes.length };
}
