import "server-only";
import { generateText, Output } from "ai";
import { z } from "zod";
import { PROMPT_COMPETENCES } from "./prompts/competences";
import { PROMPT_MODERATION } from "./prompts/moderation";
import { nettoyerCompetences, type ReponseModeration } from "./regles";

// Modèle servi par Vercel AI Gateway. Authentification automatique par le jeton OIDC du projet :
// aucune clé d'API dans le code ni dans les variables. Gratuit sur l'offre de base (choix de Hadriel).
const MODELE = "google/gemini-2.5-flash";

// IA n°1 : compétences depuis un CV (PDF). Renvoie null si l'IA est indisponible ou trop lente.
export async function extraireCompetences(pdf: Uint8Array): Promise<string[] | null> {
  try {
    const { output } = await generateText({
      model: MODELE,
      system: PROMPT_COMPETENCES,
      output: Output.object({ schema: z.object({ competences: z.array(z.string()).max(30) }) }),
      messages: [
        {
          role: "user",
          content: [
            { type: "file", mediaType: "application/pdf", data: pdf, filename: "cv.pdf" },
            { type: "text", text: "Voici mon CV. Quelles compétences puis-je proposer aux autres étudiants ?" },
          ],
        },
      ],
      abortSignal: AbortSignal.timeout(25_000),
      maxRetries: 1,
    });
    return nettoyerCompetences(output.competences);
  } catch (erreur) {
    console.error("IA compétences indisponible", erreur);
    return null;
  }
}

// IA n°2 : modération d'une annonce. Renvoie null si l'IA est indisponible (l'annonce reste « en attente »).
export async function modererAnnonce(annonce: { titre: string; description: string; lieu: string | null }): Promise<ReponseModeration | null> {
  try {
    const { output } = await generateText({
      model: MODELE,
      system: PROMPT_MODERATION,
      output: Output.object({
        schema: z.object({
          statut: z.enum(["ok", "a_verifier", "refus_probable"]),
          raisons: z.array(z.string()).max(5),
          suggestion: z.object({ titre: z.string(), description: z.string() }).nullable(),
        }),
      }),
      prompt: `<annonce>\nTitre : ${annonce.titre}\nDescription : ${annonce.description}\nLieu : ${annonce.lieu ?? "non précisé"}\n</annonce>`,
      abortSignal: AbortSignal.timeout(15_000),
      maxRetries: 1,
    });
    return output;
  } catch (erreur) {
    console.error("IA modération indisponible", erreur);
    return null;
  }
}
