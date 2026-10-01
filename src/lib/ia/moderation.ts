import "server-only";
import { after } from "next/server";
import { clientServeur } from "@/lib/supabase/admin";
import { modererAnnonce } from "./modele";
import { deciderModeration } from "./regles";

type Texte = { titre: string; description: string; lieu: string | null };

// Lance la modération IA APRÈS la réponse (l'étudiant n'attend pas).
// « refus probable » : l'annonce est masquée en attendant la décision d'un admin humain.
export function programmerModeration(id: string, annonce: Texte) {
  after(async () => {
    const serveur = clientServeur();
    if (!serveur) return; // pas de clé secrète : l'annonce reste « en attente », l'admin la verra
    const ia = await modererAnnonce(annonce);
    const decision = deciderModeration(ia, `${annonce.titre}\n${annonce.description}\n${annonce.lieu ?? ""}`);
    if (decision.statut === "en_attente") return;

    const { error } = await serveur
      .from("annonces")
      .update({
        moderation: decision.statut,
        moderation_raisons: decision.raisons,
        modere_le: new Date().toISOString(),
        ...(decision.statut === "refus_probable" ? { statut: "masquee" } : {}),
      })
      .eq("id", id);
    if (error) console.error("Écriture de la modération", error);
  });
}
