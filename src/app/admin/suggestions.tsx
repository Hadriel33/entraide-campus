import type { SupabaseClient } from "@supabase/supabase-js";
import { Bouton } from "@/components/ui/bouton";
import { CATEGORIES_SUGGESTION, type CategorieSuggestion } from "@/lib/suggestions/validation";
import { jourCampus } from "@/lib/temps";
import { suivreSuggestion } from "./actions";

type Suggestion = { id: string; categorie: string; texte: string; statut: string; cree_le: string; auteur: { pseudo: string } | null };

// Boîte à suggestions (0038) : les nouvelles d'abord. Lecture réservée à l'admin (RLS) ; l'étudiant voit la suite.
export async function AdminSuggestions({ supabase }: { supabase: SupabaseClient }) {
  const { data, error } = await supabase
    .from("suggestions")
    .select("id, categorie, texte, statut, cree_le, auteur:profils!suggestions_auteur_id_fkey(pseudo)")
    .order("cree_le", { ascending: false })
    .limit(200);
  if (error) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-4 text-sm text-encre-douce">
        La boîte à suggestions n&apos;est pas encore installée (migration 0038).
      </p>
    );
  }
  const liste = ((data ?? []) as unknown as Suggestion[]).sort((a, b) => Number(a.statut !== "nouvelle") - Number(b.statut !== "nouvelle"));
  const nouvelles = liste.filter((s) => s.statut === "nouvelle").length;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold">Boîte à suggestions</h2>
        <p className="text-sm text-encre-douce">
          {liste.length === 0 ? "Aucune suggestion pour l'instant." : `${nouvelles} nouvelle${nouvelles > 1 ? "s" : ""} sur ${liste.length}.`} L&apos;étudiant voit
          « Lue » ou « C&apos;est fait » dans ses Réglages.
        </p>
      </div>
      <ul className="flex flex-col gap-2">
        {liste.map((s) => (
          <li key={s.id} className={`flex flex-col gap-2 rounded-carte border bg-surface p-4 ${s.statut === "nouvelle" ? "border-encre" : "border-ligne"}`}>
            <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              <strong>{CATEGORIES_SUGGESTION[s.categorie as CategorieSuggestion] ?? s.categorie}</strong>
              <span className="text-encre-douce">
                @{s.auteur?.pseudo ?? "compte supprimé"} · {jourCampus(s.cree_le)}
              </span>
              <span className="ml-auto text-xs font-semibold">{s.statut === "faite" ? "Faite ✓" : s.statut === "lue" ? "Lue" : "Nouvelle"}</span>
            </p>
            <p className="whitespace-pre-line">{s.texte}</p>
            {s.statut !== "faite" && (
              <div className="flex flex-wrap gap-2">
                {s.statut === "nouvelle" && (
                  <form action={suivreSuggestion.bind(null, s.id, "lue")}>
                    <Bouton variante="contour">Marquer lue</Bouton>
                  </form>
                )}
                <form action={suivreSuggestion.bind(null, s.id, "faite")}>
                  <Bouton variante="contour">C&apos;est fait</Bouton>
                </form>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
