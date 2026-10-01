// Accueil guidé : 4 étapes pour un profil prêt à servir. Calculé à partir de l'état réel du profil.
export function etapesAccueil(etat: { avatar: boolean; competences: number; coordonnees: boolean; annonces: number }) {
  const etapes = [
    { code: "photo", titre: "Ajoute une photo", aide: "Les profils avec photo reçoivent plus de réponses.", fait: etat.avatar, lien: "/compte#photo" },
    { code: "competences", titre: "Remplis tes compétences avec ton CV", aide: "L'IA lit ton CV et propose, tu valides.", fait: etat.competences > 0, lien: "/compte#competences" },
    { code: "coordonnees", titre: "Indique comment te joindre", aide: "Téléphone ou réseau : visible seulement après ton accord.", fait: etat.coordonnees, lien: "/compte#coordonnees" },
    { code: "annonce", titre: "Publie ta première annonce", aide: "Ce que tu proposes, ou ce que tu cherches.", fait: etat.annonces > 0, lien: "/annonces/nouvelle" },
  ];
  const faites = etapes.filter((e) => e.fait).length;
  return { etapes, faites, termine: faites === etapes.length };
}
