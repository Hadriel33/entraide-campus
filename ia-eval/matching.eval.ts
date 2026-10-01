// Mesure de l'IA n°3 (« Pour moi » intelligent) contre le classement par règles, sur 30 paires profil/annonce
// annotées à la main AVANT le test (3 profils × 10 annonces : synonymes, faux amis, pièges).
// Lancement : npm run eval:ia. Appelle vraiment le modèle (3 appels par passage, 3 passages).
// Résultat écrit dans docs/ia/evaluation-matching.md. Hors CI : dépend du réseau et du modèle.
import { it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { generateText, Output } from "ai";
import { z } from "zod";
import { PROMPT_MATCHING, promptMatching } from "@/lib/ia/prompts/matching";
import { nettoyerMatchs } from "@/lib/ia/regles";
import { suggerer } from "@/lib/matching/suggestions";
import { CATEGORIES, type Categorie, type TypeAnnonce } from "@/lib/annonces/validation";

type Annonce = { id: string; type: TypeAnnonce; categorie: Categorie; titre: string; description: string; pertinent: boolean };
type Profil = { profil: string; competences: string[]; propose: Categorie[]; cherche: Categorie[]; annonces: Annonce[] };

const PASSAGES = 3;
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pannes: string[] = [];

async function demander(p: Profil) {
  for (const attente of [0, 3000, 8000]) {
    if (attente) await pause(attente);
    try {
      const { output } = await generateText({
        model: "google/gemini-2.5-flash",
        system: PROMPT_MATCHING,
        output: Output.object({ schema: z.object({ resultats: z.array(z.object({ id: z.string(), pertinence: z.number(), raison: z.string() })) }) }),
        prompt: promptMatching({ competences: p.competences, propose: p.propose.map((c) => CATEGORIES[c]), cherche: p.cherche.map((c) => CATEGORIES[c]) }, p.annonces),
        abortSignal: AbortSignal.timeout(25_000),
        maxRetries: 0,
      });
      return nettoyerMatchs(output.resultats, p.annonces.map((a) => a.id));
    } catch (e) {
      const err = e as { message?: string; statusCode?: number };
      pannes.push(`${err.statusCode ?? "réseau"} : ${String(err.message ?? e).slice(0, 100)}`);
    }
  }
  return null;
}

function scores(predits: Set<string>, cas: Annonce[]) {
  const vp = cas.filter((a) => a.pertinent && predits.has(a.id)).length;
  const fp = cas.filter((a) => !a.pertinent && predits.has(a.id)).length;
  const fn = cas.filter((a) => a.pertinent && !predits.has(a.id)).length;
  const justes = cas.filter((a) => a.pertinent === predits.has(a.id)).length;
  const precision = vp + fp ? vp / (vp + fp) : 1;
  const rappel = vp + fn ? vp / (vp + fn) : 1;
  return { justes, total: cas.length, precision, rappel, fp, fn };
}

const pct = (x: number) => `${Math.round(x * 100)} %`;

it("évaluation du matching", async () => {
  process.loadEnvFile(".env.local");
  const profils = JSON.parse(readFileSync("ia-eval/matching.json", "utf8")) as Profil[];
  const toutes = profils.flatMap((p) => p.annonces);

  // Les règles (classement simple actuel) : déterministes, un seul passage.
  const parRegles = new Set(
    profils.flatMap((p) => suggerer({ competences: p.competences, categoriesProposees: p.propose, categoriesCherchees: p.cherche }, p.annonces, Infinity).map((s) => s.annonce.id)),
  );
  const regles = scores(parRegles, toutes);

  // L'IA : pertinence ≥ 2 = « je te la montre ». Plusieurs passages pour voir si elle est stable.
  const passages: { predits: Set<string>; raisons: Map<string, string> }[] = [];
  for (let n = 0; n < PASSAGES; n++) {
    const predits = new Set<string>();
    const raisons = new Map<string, string>();
    let complet = true;
    for (const p of profils) {
      const r = await demander(p);
      if (!r) {
        complet = false;
        break;
      }
      for (const [id, m] of r) {
        if (m.pertinence >= 2) predits.add(id);
        if (m.raison) raisons.set(id, m.raison);
      }
      await pause(1500);
    }
    if (complet) passages.push({ predits, raisons });
  }
  const ia = passages.map((x) => scores(x.predits, toutes));
  const moyenne = (k: "justes" | "precision" | "rappel") => ia.reduce((s, x) => s + x[k], 0) / Math.max(1, ia.length);
  const dernier = passages.at(-1);

  const ligne = (a: Annonce, predits: Set<string>) => (predits.has(a.id) === a.pertinent ? "juste" : predits.has(a.id) ? "**montrée à tort**" : "**ratée**");
  const md = `# Évaluation de l'IA n°3 : le « Pour moi » intelligent

Mesure du ${new Date().toLocaleDateString("fr-FR")} · modèle \`google/gemini-2.5-flash\` · prompt \`src/lib/ia/prompts/matching.ts\` (v1)
Jeu : 30 paires profil/annonce annotées à la main **avant** le test (\`ia-eval/matching.json\`) : 3 profils × 10 annonces,
16 pertinentes, 14 non pertinentes, avec des synonymes (« Power BI » / « tableau de bord ») et des faux amis
(un python… le serpent ; le « montage » d'une armoire).

## Résultat

| | Bonnes décisions | Précision (ce qu'on montre est pertinent) | Rappel (ce qui est pertinent est montré) |
|---|---|---|---|
| Règles (mots exacts + catégories) | ${regles.justes}/30 (${pct(regles.justes / 30)}) | ${pct(regles.precision)} | ${pct(regles.rappel)} |
| IA n°3 (moyenne de ${ia.length} passage${ia.length > 1 ? "s" : ""}) | ${moyenne("justes").toFixed(1)}/30 (${pct(moyenne("justes") / 30)}) | ${pct(moyenne("precision"))} | ${pct(moyenne("rappel"))} |

Passages de l'IA : ${ia.map((x) => `${x.justes}/30`).join(", ") || "aucun (pannes)"}. Pannes du service : ${pannes.length}.

## Détail (dernier passage de l'IA)

| Profil | Annonce | Attendu | Règles | IA | Raison donnée par l'IA |
|---|---|---|---|---|---|
${profils
  .flatMap((p) =>
    p.annonces.map(
      (a) =>
        `| ${p.profil} | ${a.titre} | ${a.pertinent ? "pertinente" : "non"} | ${ligne(a, parRegles)} | ${dernier ? ligne(a, dernier.predits) : "-"} | ${dernier?.raisons.get(a.id) ?? ""} |`,
    ),
  )
  .join("\n")}

## Ce qu'on en retient
- Les règles ratent les besoins écrits avec d'autres mots, et se trompent sur les faux amis (un « python » qui est un serpent).
- L'IA est appelée **à la demande** seulement (bouton « Demander à Colette ») : une requête, 40 annonces, quelques secondes.
- Si l'IA est indisponible, l'appli garde le classement par règles : rien ne casse.
- Seules les compétences et les catégories partent vers le modèle : ni nom, ni CV, ni coordonnées.
${pannes.length ? `\nPannes rencontrées : ${[...new Set(pannes)].slice(0, 5).join(" ; ")}` : ""}
`;
  writeFileSync("docs/ia/evaluation-matching.md", md);
  console.log(md.split("## Détail")[0]);
}, 600_000);
