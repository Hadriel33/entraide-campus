import "server-only";
import { clientServeur } from "@/lib/supabase/admin";
import { budgetAtteint, coutEuros } from "./cout";

export type IA = "cv" | "moderation" | "redaction" | "tri";

// Avant chaque appel d'IA : la dépense totale est-elle encore sous le plafond réglé par l'admin (0035) ?
// Sans clé serveur, on ne peut pas suivre : on laisse passer (comme avant), la modération restant « en attente ».
export async function budgetDisponible(): Promise<boolean> {
  const serveur = clientServeur();
  if (!serveur) return true;
  const [{ data: reglage }, { data: lignes }] = await Promise.all([
    serveur.from("ia_reglages").select("plafond_eur").maybeSingle(),
    serveur.from("ia_usages").select("cout_eur").limit(100000),
  ]);
  if (!reglage) return true;
  const depense = (lignes ?? []).reduce((t, l) => t + Number(l.cout_eur), 0);
  return !budgetAtteint(depense, Number(reglage.plafond_eur));
}

// Après chaque appel : tokens et coût estimé, d'après le modèle réellement servi (secours compris).
export async function noterUsage(ia: IA, modele: string, usage: { inputTokens?: number; outputTokens?: number } | undefined) {
  const serveur = clientServeur();
  if (!serveur) return;
  const entree = usage?.inputTokens ?? 0;
  const sortie = usage?.outputTokens ?? 0;
  const { error } = await serveur.from("ia_usages").insert({
    ia,
    modele: modele.slice(0, 80),
    tokens_entree: entree,
    tokens_sortie: sortie,
    cout_eur: coutEuros({ modele, entree, sortie }),
  });
  if (error) console.error("Suivi du coût IA", error);
}
