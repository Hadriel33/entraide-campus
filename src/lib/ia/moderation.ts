import "server-only";
import { after } from "next/server";
import { clientServeur } from "@/lib/supabase/admin";
import { modererAnnonce } from "./modele";
import { deciderModeration, proposerCorrection } from "./regles";

type Texte = { titre: string; description: string; lieu: string | null };

// Lance la modération IA APRÈS la réponse (l'étudiant n'attend pas).
// « refus probable » : l'annonce est masquée en attendant la décision d'un admin humain.
// « à vérifier » réparable : une version corrigée est proposée à l'auteur, qui l'accepte ou non.
export function programmerModeration(id: string, annonce: Texte) {
  after(async () => {
    const serveur = clientServeur();
    if (!serveur) return; // pas de clé secrète : l'annonce reste « en attente », l'admin la verra
    const ia = await modererAnnonce(annonce);
    const decision = deciderModeration(ia, `${annonce.titre}\n${annonce.description}\n${annonce.lieu ?? ""}`);
    const suggestion = proposerCorrection(ia, annonce, decision.statut);
    if (decision.statut === "en_attente" && !suggestion) return;

    const { error } = await serveur
      .from("annonces")
      .update({
        moderation: decision.statut === "en_attente" ? "a_verifier" : decision.statut,
        moderation_raisons: decision.raisons,
        moderation_suggestion: suggestion,
        modere_le: new Date().toISOString(),
        ...(decision.statut === "refus_probable" ? { statut: "masquee" } : {}),
      })
      .eq("id", id);
    if (error) console.error("Écriture de la modération", error);
  });
}
