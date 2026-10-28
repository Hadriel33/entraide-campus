// Post-its de groupe : un post-it partagé par 2 à 4 personnes qui ont toutes dit oui.
// Les règles sont en base (migration 0029) ; ici, la lecture et la mise en forme.

export const MAX_MEMBRES = 3; // en plus du créateur

const PSEUDO = /^[a-z0-9_][a-z0-9._]{1,18}[a-z0-9_]$/; // même format que la base (0003)

export function validerPseudoInvite(brut: unknown): string | null {
  const v = String(brut ?? "").trim().replace(/^@/, "").toLowerCase();
  return PSEUDO.test(v) ? v : null;
}

export function peutInviter(nbMembres: number) {
  return nbMembres < MAX_MEMBRES;
}

type Membre<P> = { statut: string; membre: P | null };

export function equipeAcceptee<P>(membres: Membre<P>[] | null | undefined): P[] {
  return (membres ?? []).filter((m) => m.statut === "accepte" && m.membre).map((m) => m.membre as P);
}

export function libelleEquipe(createur: string, membres: string[]) {
  if (membres.length === 0) return `@${createur}`;
  if (membres.length === 1) return `@${createur} et @${membres[0]}`;
  return `@${createur} et ${membres.length} potes`;
}
