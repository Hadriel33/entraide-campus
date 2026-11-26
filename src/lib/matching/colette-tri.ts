// Tri « Pour moi » relu par Colette (IA n°3) : on garde ce qu'elle note 2 (« ça peut coller ») ou 3 (« parfait »).
// Si elle ne retient rien, on renvoie null et la page garde le tri par règles : la liste n'est jamais vidée par l'IA.
type NoteColette = { pertinence: number; raison?: string };

export function classerAvecColette<A extends { id: string }>(
  lot: A[],
  ia: Map<string, NoteColette>,
  regles: Map<string, number>,
): { annonce: A; pertinence: number; raison: string }[] | null {
  const note = (id: string) => ia.get(id)?.pertinence ?? 0;
  const retenues = lot
    .filter((a) => note(a.id) >= 2)
    .sort((a, b) => note(b.id) - note(a.id) || (regles.get(b.id) ?? 0) - (regles.get(a.id) ?? 0));
  if (retenues.length === 0) return null;
  return retenues.map((a) => ({ annonce: a, pertinence: note(a.id), raison: ia.get(a.id)?.raison ?? "" }));
}
