import type { Categorie } from "@/lib/annonces/validation";

// Colette souffle une première phrase quand la discussion s'ouvre : une pratique, une sympa, une blague
// liée à la catégorie. Écrites à la main (pas d'IA : instantané, gratuit, jamais déplacé). L'étudiant choisit,
// modifie, puis envoie lui-même.

const BLAGUES: Record<Categorie, string[]> = {
  photo: [
    "Promis, cette fois je ne cligne pas des yeux sur la photo.",
    "Je ramène mon meilleur profil, tu ramènes ton meilleur objectif ?",
  ],
  video: [
    "On tourne tout en une prise ? (Spoiler : non.)",
    "Je m'occupe du café, tu t'occupes du clap de fin ?",
  ],
  design: [
    "Je te préviens, je suis team Comic Sans... non je rigole.",
    "On se fixe une règle : pas plus de trois polices. Deal ?",
  ],
  ux_ui: [
    "On se cale ça ? Promis, aucune pop-up de cookies.",
    "Dis-moi tout, je suis prêt à tester même le bouton le plus caché.",
  ],
  dev: [
    "Ça marche sur ma machine, on regarde sur la tienne ?",
    "J'apporte la patience, tu apportes les messages d'erreur.",
  ],
  data_ia: [
    "Mon Excel a plus d'onglets que mon navigateur, prépare-toi.",
    "On fait parler les données, mais gentiment.",
  ],
  redaction: [
    "Je relis, tu respires. Les virgules n'ont qu'à bien se tenir.",
    "On chasse les fautes ensemble, comme des pros du Bescherelle.",
  ],
  coloc: [
    "Question importante : team vaisselle tout de suite, ou demain ?",
    "Je cuisine bien les pâtes. C'est un argument, non ?",
  ],
  covoiturage: [
    "Qui gère la playlist : le conducteur ou les passagers ?",
    "Je promets de ne pas chanter faux. Enfin, pas trop fort.",
  ],
  materiel: [
    "Je te le rends en meilleur état qu'avant. Et peut-être même nettoyé.",
    "Promis, je le traite comme un objet de collection.",
  ],
  binome: [
    "Duo ESD × ESP : on fait trembler le classement ?",
    "Toi la tête, moi les jambes ? Ou l'inverse, on verra.",
  ],
  shooting: [
    "Je travaille mon regard mystérieux depuis ce matin.",
    "Prépare-toi, j'ai trois poses. Dont deux ratées.",
  ],
  coup_de_main: [
    "Je ramène les croissants, tu ramènes la motivation ?",
    "Deux bras de plus, zéro râlerie, c'est promis.",
  ],
};

export type Suggestion = {
  ton: "pratique" | "sympa" | "blague";
  texte: string;
};

// « graine » : un nombre stable par discussion (pour varier les phrases d'une conversation à l'autre).
export function phrasesColette({
  categorie,
  jAide,
  prenom,
  graine = 0,
}: {
  categorie: Categorie;
  jAide: boolean;
  prenom: string;
  graine?: number;
}): Suggestion[] {
  const blagues = BLAGUES[categorie] ?? BLAGUES.coup_de_main;
  return [
    {
      ton: "pratique",
      texte: jAide
        ? `Salut ${prenom} ! Dis-m'en plus : c'est pour quand, et qu'est-ce qu'il te faut exactement ?`
        : `Salut ${prenom} ! Merci d'avoir accepté. Tu es dispo quand cette semaine ?`,
    },
    {
      ton: "sympa",
      texte:
        graine % 2
          ? "On se retrouve à la cafét' entre deux cours ?"
          : "On se voit devant le campus, à la pause de midi ?",
    },
    { ton: "blague", texte: blagues[Math.abs(graine) % blagues.length] },
  ];
}

// Une graine stable à partir de l'id de la discussion.
export function graineDe(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}
