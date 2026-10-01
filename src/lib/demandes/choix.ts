import type { Stats } from "@/lib/gamification/progression";
import { calculerProgression } from "@/lib/gamification/progression";

// Plusieurs personnes intéressées par la même annonce : on les regroupe pour que l'auteur compare et choisisse.
// Ce n'est jamais « premier arrivé, premier servi » : l'auteur décide, et peut en accepter plusieurs.

type AvecAnnonce = {
  id: string;
  cree_le: string;
  annonce: { id: string; titre: string } | null;
};

export type Groupe<T> = {
  annonce: { id: string; titre: string };
  demandes: T[];
};

// Groupes d'au moins 2 demandes en attente sur une même annonce (les plus anciennes d'abord dans un groupe,
// le groupe le plus fourni en premier). Les demandes seules restent affichées en post-it normal.
export function grouperParAnnonce<T extends AvecAnnonce>(
  demandes: T[],
): { groupes: Groupe<T>[]; seules: T[] } {
  const parAnnonce = new Map<string, Groupe<T>>();
  const seules: T[] = [];
  for (const d of demandes) {
    if (!d.annonce) {
      seules.push(d);
      continue;
    }
    const g = parAnnonce.get(d.annonce.id) ?? {
      annonce: d.annonce,
      demandes: [],
    };
    g.demandes.push(d);
    parAnnonce.set(d.annonce.id, g);
  }
  const groupes: Groupe<T>[] = [];
  for (const g of parAnnonce.values()) {
    if (g.demandes.length >= 2) {
      g.demandes.sort((a, b) => a.cree_le.localeCompare(b.cree_le));
      groupes.push(g);
    } else seules.push(...g.demandes);
  }
  groupes.sort((a, b) => b.demandes.length - a.demandes.length);
  seules.sort((a, b) => b.cree_le.localeCompare(a.cree_le));
  return { groupes, seules };
}

// Ce qu'on montre d'un candidat pour comparer : des faits, jamais ses coordonnées.
export function resumeCandidat(s: Stats | null) {
  if (!s)
    return {
      aides: 0,
      avis: 0,
      note: null as number | null,
      badges: 0,
      niveau: "Nouveau",
    };
  const p = calculerProgression(s);
  return {
    aides: s.aides_donnees,
    avis: s.nb_avis,
    note: s.note_moyenne,
    badges: p.badges.filter((b) => b.obtenu).length,
    niveau: p.niveau.nom,
  };
}
