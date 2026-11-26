/**
 * Garde-fou du vocabulaire (retour de test du 19/11 : « être cohérent partout, donc post-it »).
 * Les textes visibles disent « post-it », « Mes échanges » et « Entraide », jamais « annonce », « Mes demandes »
 * ou « Entraide-toi ». Le code (noms de tables, de routes, de types) garde « annonce » : seul le texte lu compte.
 * Hors périmètre : les commentaires, les journaux serveur (console) et les prompts des IA (lus par le modèle).
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");

const INTERDITS = [
  // « une annonce », « ton annonce », « l'annonce », « des annonces »... dans une phrase.
  /\b(?:(?:une|ton|ta|tes|mes|les|des|cette|nouvelle|chaque|dernières)\s+|[ld]')annonces?\b/i,
  // « Annonces gratuites », >Annonce<, "Annonce" : un texte qui commence par le mot.
  /["'`>]\s*Annonces?\b/,
  /Mes demandes/,
  /Entraide-toi/,
];

function fichiers(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" || p.endsWith(path.join("ia", "prompts")) ? [] : fichiers(p);
    return /\.(tsx|ts)$/.test(e.name) ? [p] : [];
  });
}

// Retire ce qui n'est pas affiché : commentaires de ligne, commentaires JSX, lignes de journal.
function texteVisible(ligne: string) {
  const l = ligne.trim();
  if (/^(\/\/|\*|\/\*)/.test(l) || /console\.(log|error|warn)/.test(l)) return "";
  return l.replace(/\{\/\*.*?\*\/\}/g, "").replace(/\s\/\/\s.*$/, "");
}

describe("vocabulaire", () => {
  it("les textes visibles disent « post-it », pas « annonce »", () => {
    const trouves: string[] = [];
    for (const f of fichiers(SRC)) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ligne, i) => {
          const t = texteVisible(ligne);
          if (INTERDITS.some((re) => re.test(t))) trouves.push(`${path.relative(SRC, f)}:${i + 1}  ${t}`);
        });
    }
    expect(trouves).toEqual([]);
  });
});
