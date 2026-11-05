// Les post-its arrivés en direct sur le tableau : leurs identifiants servent à un sélecteur CSS,
// on ne garde donc que des UUID (rien d'autre ne peut finir dans la feuille de style).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function idsSurs(ids: unknown[]): string[] {
  return ids.filter((i): i is string => typeof i === "string" && UUID.test(i));
}
