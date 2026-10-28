// Les 4 IA de l'appli, expliquées en clair aux étudiants (page /ia et pastilles « IA de Colette »).
// Une seule source : si une IA change, on met à jour ce fichier et tout suit.
export type PresentationIA = {
  numero: 1 | 2 | 3 | 4;
  nom: string;
  badge: string;
  sertA: string;
  ou: { href: string; label: string };
  tuDecides: string;
  jamais: string;
};

export const IAS: PresentationIA[] = [
  {
    numero: 1,
    nom: "Colette lit ton CV",
    badge: "IA · lit ton CV",
    sertA: "Tu déposes ton CV en PDF, Colette repère ce que tu sais faire et te propose une liste de compétences pour ton profil.",
    ou: { href: "/compte#competences", label: "Mon profil, « Mes compétences »" },
    tuDecides: "Tu coches, corriges ou retires chaque proposition. Rien n'est enregistré sans ton clic.",
    jamais: "Ton CV n'est pas conservé : il est lu une fois, puis oublié.",
  },
  {
    numero: 2,
    nom: "Colette relit ton post-it",
    badge: "IA · relit ton post-it",
    sertA: "À chaque publication, Colette vérifie qu'il n'y a ni arnaque, ni contenu blessant, ni numéro ou email laissé en clair.",
    ou: { href: "/annonces/nouvelle", label: "Publier un post-it" },
    tuDecides: "Si elle remarque un souci, elle t'explique pourquoi et propose une correction : tu l'acceptes ou non.",
    jamais: "Elle ne supprime rien seule : un humain de l'équipe tranche les cas douteux.",
  },
  {
    numero: 3,
    nom: "Colette trie le tableau pour toi",
    badge: "IA · trie pour toi",
    sertA: "Avec « Pour moi », Colette lit les post-its récents et remonte ceux qui collent à tes compétences, même sans les mots exacts.",
    ou: { href: "/annonces?tri=pour_moi", label: "Le tableau, tri « Pour moi »" },
    tuDecides: "C'est seulement un ordre d'affichage : tu vois toujours tous les post-its et tu choisis.",
    jamais: "Elle ne contacte personne à ta place et ne montre jamais tes coordonnées.",
  },
  {
    numero: 4,
    nom: "Colette écrit ton post-it",
    badge: "IA · écrit pour toi",
    sertA: "Pas envie de tout remplir ? Décris ton idée en une phrase, Colette en fait un post-it complet : catégorie, titre, description.",
    ou: { href: "/annonces/nouvelle", label: "Publier, « Colette, écris-la pour moi »" },
    tuDecides: "Le brouillon remplit le formulaire : tu relis, tu modifies, et rien n'est publié sans ton clic.",
    jamais: "Elle n'invente pas de prix ni de coordonnées, et ne publie jamais à ta place.",
  },
];

export function iaNumero(n: 1 | 2 | 3 | 4) {
  return IAS[n - 1];
}
