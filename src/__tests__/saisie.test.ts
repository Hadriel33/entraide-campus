// Retour de test du 19/11 : « mettre les dropdowns dans la DA et les champs formulaire ».
// Toutes les listes déroulantes partagent le style de saisie de la charte (src/components/ui/saisie.ts).
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SRC = path.resolve(__dirname, "..");
function fichiers(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "__tests__" ? [] : fichiers(p);
    return e.name.endsWith(".tsx") ? [p] : [];
  });
}

describe("champs de saisie dans la DA", () => {
  it("chaque <select> utilise le style partagé SAISIE", () => {
    const hors: string[] = [];
    for (const f of fichiers(SRC)) {
      const texte = readFileSync(f, "utf8");
      for (const m of texte.matchAll(/<select\b(?:=>|[^>])*>/g)) {
        if (!/SAISIE/.test(m[0])) hors.push(`${path.relative(SRC, f)}:${texte.slice(0, m.index).split("\n").length}`);
      }
    }
    expect(hors).toEqual([]);
  });
});
