// Mesure de l'IA n°2 sur 40 annonces annotées à la main (20 ok, 10 à vérifier, 10 refus probables).
// Lancement : npm run eval:ia (appelle vraiment le modèle : quelques minutes, gratuit sur la passerelle Vercel).
// Résultat écrit dans docs/ia/evaluation-moderation.md. Ce n'est pas un test de la CI : il dépend du réseau et du modèle.
import { it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { generateText, Output } from "ai";
import { z } from "zod";
import { PROMPT_MODERATION } from "@/lib/ia/prompts/moderation";
import { deciderModeration, detecterCoordonnees, proposerCorrection, type ReponseModeration } from "@/lib/ia/regles";

type Cas = { attendu: "ok" | "a_verifier" | "refus_probable"; titre: string; description: string };
const STATUTS = ["ok", "a_verifier", "refus_probable"] as const;

const causes: string[] = [];
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Jusqu'à 3 essais espacés (l'offre gratuite limite le débit), comme le ferait un vrai client.
async function moderer(c: Cas): Promise<ReponseModeration | null> {
  for (const attente of [0, 3000, 8000]) {
    if (attente) await pause(attente);
    const r = await essai(c);
    if (r) return r;
  }
  return null;
}

async function essai(c: Cas): Promise<ReponseModeration | null> {
  try {
    const { output } = await generateText({
      model: "google/gemini-2.5-flash",
      system: PROMPT_MODERATION,
      output: Output.object({
        schema: z.object({
          statut: z.enum(STATUTS),
          raisons: z.array(z.string()).max(5),
          suggestion: z.object({ titre: z.string(), description: z.string() }).nullable(),
        }),
      }),
      prompt: `<annonce>\nTitre : ${c.titre}\nDescription : ${c.description}\nLieu : non précisé\n</annonce>`,
      abortSignal: AbortSignal.timeout(20_000),
      maxRetries: 0,
    });
    return output;
  } catch (e) {
    const err = e as { message?: string; statusCode?: number };
    causes.push(`${err.statusCode ?? "réseau"} : ${String(err.message ?? e).slice(0, 100)}`);
    return null;
  }
}

it("évaluation de la modération", async () => {
  process.loadEnvFile(".env.local");
  const cas = JSON.parse(readFileSync("ia-eval/annonces.json", "utf8")) as Cas[];
  const lignes: { c: Cas; obtenu: string; correction: boolean; coordonneesRestantes: boolean; ms: number }[] = [];

  // 2 appels à la fois, pour rester sous la limite de débit de l'offre gratuite.
  for (let i = 0; i < cas.length; i += 2) {
    const lot = await Promise.all(
      cas.slice(i, i + 2).map(async (c) => {
        const t0 = Date.now();
        const ia = await moderer(c);
        const d = deciderModeration(ia, `${c.titre}\n${c.description}`);
        const corr = proposerCorrection(ia, c, d.statut);
        // Panne de l'IA : la décision vient alors des seules règles fixes, on la compte à part.
        return { c, obtenu: ia ? d.statut : "en_attente", correction: !!corr, coordonneesRestantes: !!corr && detecterCoordonnees(`${corr.titre}\n${corr.description}`), ms: Date.now() - t0 };
      }),
    );
    lignes.push(...lot);
    await pause(1500);
  }

  // Les pannes sont comptées à part : une annonce « en attente » n'est ni juste ni fausse, elle attend un humain.
  const mesurees = lignes.filter((l) => l.obtenu !== "en_attente");
  const justes = mesurees.filter((l) => l.obtenu === l.c.attendu).length;
  const matrice = STATUTS.map((a) => STATUTS.map((o) => lignes.filter((l) => l.c.attendu === a && l.obtenu === o).length));
  const sur = (a: string) => mesurees.filter((l) => l.c.attendu === a).length;
  const refusAttrapes = mesurees.filter((l) => l.c.attendu === "refus_probable" && l.obtenu === "refus_probable").length;
  const okBloques = mesurees.filter((l) => l.c.attendu === "ok" && l.obtenu !== "ok").length;
  const problemesVus = mesurees.filter((l) => l.c.attendu !== "ok" && l.obtenu !== "ok").length;
  const laxistes = mesurees.filter((l) => l.c.attendu !== "ok" && l.obtenu === "ok").length;
  const avecCoordonnees = lignes.filter((l) => detecterCoordonnees(`${l.c.titre}\n${l.c.description}`));
  const coordonneesCorrigees = avecCoordonnees.filter((l) => l.correction && !l.coordonneesRestantes).length;
  const pannes = lignes.filter((l) => l.obtenu === "en_attente").length;
  const mediane = [...lignes.map((l) => l.ms)].sort((a, b) => a - b)[Math.floor(lignes.length / 2)];
  const nom = { ok: "ok", a_verifier: "à vérifier", refus_probable: "refus probable", en_attente: "en attente (IA en panne)" } as Record<string, string>;

  const md = `# Mesure de l'IA n°2 (modération) sur 40 annonces annotées à la main

Date : ${new Date().toLocaleDateString("fr-FR")} · Modèle : google/gemini-2.5-flash · Prompt : version 2 · Décision = IA + règles fixes
Jeu de test : \`ia-eval/annonces.json\` (20 normales, 10 à vérifier, 10 inacceptables), écrit et annoté avant de lancer la mesure.

## Résultats
| Indicateur | Résultat |
|---|---|
| Bonne décision | **${justes} / ${mesurees.length}** (${Math.round((justes / Math.max(1, mesurees.length)) * 100)} %) |
| Annonces inacceptables bien bloquées (refus probable) | **${refusAttrapes} / ${sur("refus_probable")}** |
| Annonces problématiques repérées (à vérifier ou refus) | **${problemesVus} / ${sur("a_verifier") + sur("refus_probable")}** |
| Erreur grave : annonce problématique jugée « ok » | **${laxistes}** |
| Annonces normales freinées à tort (faux positifs) | **${okBloques} / ${sur("ok")}** |
| Coordonnées dans le texte : correction proposée sans coordonnées | **${coordonneesCorrigees} / ${avecCoordonnees.length}** |
| Pannes de l'IA après 3 essais (l'annonce reste en attente pour l'admin) | ${pannes} |
| Temps médian par annonce | ${(mediane / 1000).toFixed(1)} s |

## Matrice de confusion (lignes : attendu, colonnes : décision)
| Attendu \\\\ Décision | ok | à vérifier | refus probable |
|---|---|---|---|
${STATUTS.map((a, i) => `| ${nom[a]} | ${matrice[i].join(" | ")} |`).join("\n")}

## Les erreurs, une par une
${lignes.filter((l) => l.obtenu !== l.c.attendu).map((l) => `- « ${l.c.titre} » : attendu ${nom[l.c.attendu]}, décision ${nom[l.obtenu]}`).join("\n") || "- Aucune."}

${causes.length ? `## Erreurs réseau rencontrées (avant nouvel essai)\n${[...new Set(causes)].slice(0, 5).map((c) => `- ${c}`).join("\n")}\n\n` : ""}## Comment lire ces chiffres
- Une erreur vers le **plus strict** (une annonce normale « à vérifier ») coûte peu : elle reste visible et un admin la valide.
- Une erreur vers le **plus laxiste** (une arnaque jugée « ok ») est la plus grave : c'est celle qu'on surveille d'abord.
- Les règles fixes (téléphones, emails) ne peuvent que rendre la décision plus stricte, jamais plus laxiste.
`;
  writeFileSync("docs/ia/evaluation-moderation.md", md);
  console.log(md);
}, 900_000);
