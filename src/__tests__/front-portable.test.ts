/**
 * Garde-fou du front « portable » (consigne : pouvoir migrer vers n'importe quelle référence visuelle).
 * - Aucune couleur en dur dans les composants : tout passe par les jetons de globals.css.
 * - Aucun emoji ni tiret cadratin dans les textes (règle anti-look IA, reprise de padel-snipe).
 * Échoue avec fichier:ligne pour corriger vite.
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");
const COULEUR_EN_DUR = /#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(|oklch\(/;
const EMOJI = /(?![©®™])\p{Extended_Pictographic}|\u{FE0F}/u;
const TIRET_CADRATIN = /—/;

function fichiers(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : fichiers(p);
    return /\.(tsx|ts)$/.test(e.name) ? [p] : [];
  });
}

function chercher(re: RegExp) {
  const trouves: string[] = [];
  for (const f of fichiers(SRC)) {
    readFileSync(f, "utf8")
      .split("\n")
      .forEach((ligne, i) => {
        if (re.test(ligne)) trouves.push(`${path.relative(SRC, f)}:${i + 1}  ${ligne.trim()}`);
      });
  }
  return trouves;
}

describe("front portable", () => {
  it("n'a aucune couleur en dur hors des jetons du thème", () => {
    expect(chercher(COULEUR_EN_DUR)).toEqual([]);
  });

  it("n'a ni emoji ni tiret cadratin", () => {
    expect([...chercher(EMOJI), ...chercher(TIRET_CADRATIN)]).toEqual([]);
  });
});
