// @mentions dans les commentaires : même format de pseudo que la base (migration 0003).
// La notification est envoyée par la base (migration 0027) ; ici, seulement la lecture et l'affichage.
const MENTION = /(^|[^a-z0-9._@])@([a-z0-9_][a-z0-9._]{1,18}[a-z0-9_])/gi;
const MAX = 5;

export function extraireMentions(texte: string): string[] {
  const vus = new Set<string>();
  for (const m of texte.matchAll(MENTION)) {
    vus.add(m[2].toLowerCase());
    if (vus.size === MAX) break;
  }
  return [...vus];
}

export type Morceau = { texte: string } | { pseudo: string };

export function decouperMentions(texte: string): Morceau[] {
  const morceaux: Morceau[] = [];
  let fin = 0;
  for (const m of texte.matchAll(MENTION)) {
    const debut = m.index + m[1].length;
    if (debut > fin) morceaux.push({ texte: texte.slice(fin, debut) });
    morceaux.push({ pseudo: m[2].toLowerCase() });
    fin = debut + 1 + m[2].length;
  }
  if (fin < texte.length) morceaux.push({ texte: texte.slice(fin) });
  return morceaux;
}
