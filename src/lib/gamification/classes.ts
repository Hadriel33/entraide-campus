// Classement des classes : score = moyenne des points de ses membres ACTIFS (au moins 1 point sur la période).
// La moyenne évite qu'une grosse classe gagne juste par le nombre ; les points viennent du même calcul
// anti-triche que le classement individuel (partenaires distincts, rien de stocké).
export type Classe = { id: string; nom: string; ecole: string };
export type Participant = { classe_id: string | null; points: number };
export type LigneClasse = Classe & { score: number; total: number; actifs: number; membres: number };

export function classerClasses(classes: Classe[], participants: Participant[]): LigneClasse[] {
  return classes
    .map((c) => {
      const membres = participants.filter((p) => p.classe_id === c.id);
      const actifs = membres.filter((p) => p.points > 0);
      const total = actifs.reduce((s, p) => s + p.points, 0);
      return { ...c, total, actifs: actifs.length, membres: membres.length, score: actifs.length ? Math.round(total / actifs.length) : 0 };
    })
    .filter((c) => c.actifs > 0)
    .sort((a, b) => b.score - a.score || b.actifs - a.actifs || a.nom.localeCompare(b.nom));
}
