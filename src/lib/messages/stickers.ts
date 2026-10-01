import type {
  Accessoire,
  AnimColette,
  CouleurColette,
  Humeur,
} from "@/components/colette/colette";

// Les stickers de Colette dans les discussions. Un sticker est un message ordinaire dont le texte est un code
// (« [colette:merci] ») : rien ne change en base, et un vieux client affiche simplement le code.
export type Sticker = {
  code: string;
  legende: string;
  humeur: Humeur;
  anim: AnimColette;
  couleur: CouleurColette;
  accessoire: Accessoire;
};

export const STICKERS: Sticker[] = [
  {
    code: "merci",
    legende: "Merci !",
    humeur: "contente",
    anim: "coucou",
    couleur: "jaune",
    accessoire: "aucun",
  },
  {
    code: "bravo",
    legende: "Bravo !",
    humeur: "fiere",
    anim: "saute",
    couleur: "lilas",
    accessoire: "etoile",
  },
  {
    code: "ok",
    legende: "C'est noté",
    humeur: "concentree",
    anim: "tampon",
    couleur: "ciel",
    accessoire: "aucun",
  },
  {
    code: "jarrive",
    legende: "J'arrive !",
    humeur: "contente",
    anim: "cherche",
    couleur: "ocre",
    accessoire: "covoit",
  },
  {
    code: "reflechit",
    legende: "Je regarde ça",
    humeur: "concentree",
    anim: "reflechit",
    couleur: "ciel",
    accessoire: "aucun",
  },
  {
    code: "oups",
    legende: "Oups, débordé",
    humeur: "surprise",
    anim: "debordee",
    couleur: "jaune",
    accessoire: "aucun",
  },
  {
    code: "cafe",
    legende: "Pause café ?",
    humeur: "contente",
    anim: "flotte",
    couleur: "ocre",
    accessoire: "cafe",
  },
  {
    code: "dodo",
    legende: "Bonne nuit",
    humeur: "dort",
    anim: "dort",
    couleur: "lilas",
    accessoire: "aucun",
  },
];

const PAR_CODE = new Map(STICKERS.map((s) => [s.code, s]));
const MOTIF = /^\[colette:([a-z]+)\]$/;

export function contenuSticker(code: string) {
  return `[colette:${code}]`;
}

// Le message est-il un sticker connu ? (sinon on l'affiche comme du texte)
export function stickerDe(contenu: string): Sticker | null {
  const m = MOTIF.exec(contenu.trim());
  return m ? (PAR_CODE.get(m[1]) ?? null) : null;
}
