import type { Stats } from "@/lib/gamification/progression";

// La garde-robe de Colette (mêmes listes et mêmes conditions que la base, migrations 0017 et 0018).
// Certaines pièces se débloquent en s'entraidant : la base refuse un objet verrouillé, même via l'API.
export const COULEURS_COLETTE = { jaune: "Jaune", lilas: "Lilas", ciel: "Ciel", ocre: "Ocre" } as const;
export const HUMEURS_COLETTE = { contente: "Contente", fiere: "Fière", surprise: "Surprise", concentree: "Concentrée" } as const;

type Objet = { nom: string; condition?: (s: Stats) => boolean; aide?: string };

export const ACCESSOIRES_COLETTE: Record<string, Objet> = {
  aucun: { nom: "Rien" },
  casque: { nom: "Casque audio" },
  photo: { nom: "Appareil photo" },
  design: { nom: "Béret de designer" },
  dev: { nom: "Lunettes de dev" },
  data: { nom: "Graphique" },
  coloc: { nom: "Carton de déménagement" },
  covoit: { nom: "Casquette de pilote" },
  noel: { nom: "Bonnet" },
  noeud: { nom: "Nœud papillon", condition: (s) => s.annonces >= 1, aide: "Publie une annonce" },
  echarpe: { nom: "Écharpe", condition: (s) => s.nb_avis >= 1, aide: "Reçois un avis" },
  bde: { nom: "Lunettes de soleil", condition: (s) => s.croisements >= 1, aide: "Entraide-toi avec l'autre école" },
  etoile: { nom: "Étoile de shérif", condition: (s) => (s.defis_reussis ?? 0) >= 1, aide: "Réussis un défi de la semaine" },
  cape: { nom: "Cape de super-héros", condition: (s) => s.aides_donnees >= 3, aide: "Aide 3 personnes" },
  couronne: { nom: "Couronne", condition: (s) => s.nb_avis >= 3 && (s.note_moyenne ?? 0) >= 4.5, aide: "3 avis, moyenne 4,5" },
  diplome: { nom: "Diplôme", condition: (s) => s.aides_donnees >= 10, aide: "Aide 10 personnes" },
};

export const MOTIFS_COLETTE: Record<string, Objet> = {
  uni: { nom: "Uni" },
  ligne: { nom: "Cahier ligné" },
  pois: { nom: "À pois", condition: (s) => s.aides_recues >= 1, aide: "Reçois un coup de main" },
  quadrille: { nom: "Quadrillé", condition: (s) => s.categories >= 3, aide: "Publie dans 3 catégories" },
  dore: { nom: "Doré", condition: (s) => s.aides_donnees >= 10, aide: "Aide 10 personnes" },
};

export function estDebloque(objet: Objet | undefined, s: Stats | null) {
  if (!objet) return false;
  return !objet.condition || (!!s && objet.condition(s));
}

export type ChoixColette = { colette_couleur: string; colette_humeur: string; colette_accessoire: string; colette_motif: string };

export function validerColette(brut: Record<string, unknown>): ChoixColette | null {
  const couleur = String(brut.couleur ?? "");
  const humeur = String(brut.humeur ?? "");
  const accessoire = String(brut.accessoire ?? "");
  const motif = String(brut.motif ?? "uni");
  if (!(couleur in COULEURS_COLETTE) || !(humeur in HUMEURS_COLETTE) || !(accessoire in ACCESSOIRES_COLETTE) || !(motif in MOTIFS_COLETTE)) return null;
  return { colette_couleur: couleur, colette_humeur: humeur, colette_accessoire: accessoire, colette_motif: motif };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validerClasse(brut: unknown): string | null | false {
  const v = String(brut ?? "").trim();
  if (!v) return null; // aucune classe
  return UUID.test(v) ? v : false;
}

export function validerNomClasse(brut: unknown): string | null {
  const v = String(brut ?? "").trim().replace(/\s+/g, " ");
  return v.length >= 2 && v.length <= 60 ? v : null;
}
