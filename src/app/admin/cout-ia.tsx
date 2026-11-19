import type { SupabaseClient } from "@supabase/supabase-js";
import { Bouton } from "@/components/ui/bouton";
import { changerPlafondIA } from "./actions";

const NOMS: Record<string, string> = {
  cv: "IA n°1, lecture du CV",
  moderation: "IA n°2, relecture des post-its",
  tri: "IA n°3, tri « Pour moi »",
  redaction: "IA n°4, rédaction d'un post-it",
};
const euros = (n: number) => `${n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 4 })} €`;

// Le coût des IA (0035) : total dépensé, détail par IA, et le plafond total réglable. Lecture réservée à l'admin (RLS).
export async function CoutIA({ supabase }: { supabase: SupabaseClient }) {
  const [{ data: reglage }, { data: lignes }] = await Promise.all([
    supabase.from("ia_reglages").select("plafond_eur, maj_le").maybeSingle(),
    supabase.from("ia_usages").select("ia, tokens_entree, tokens_sortie, cout_eur").limit(100000),
  ]);
  if (!reglage) {
    return (
      <p className="rounded-carte border border-ligne bg-surface p-4 text-sm text-encre-douce">
        Le suivi du coût des IA n&apos;est pas encore installé (migration 0035).
      </p>
    );
  }
  const plafond = Number(reglage.plafond_eur);
  const parIA = new Map<string, { appels: number; tokens: number; cout: number }>();
  for (const l of lignes ?? []) {
    const p = parIA.get(l.ia) ?? { appels: 0, tokens: 0, cout: 0 };
    parIA.set(l.ia, { appels: p.appels + 1, tokens: p.tokens + l.tokens_entree + l.tokens_sortie, cout: p.cout + Number(l.cout_eur) });
  }
  const total = [...parIA.values()].reduce((t, p) => t + p.cout, 0);
  const pourcent = plafond > 0 ? Math.min(100, Math.round((total / plafond) * 100)) : 100;
  const atteint = total >= plafond;

  return (
    <section id="cout-ia" className="flex scroll-mt-6 flex-col gap-4 rounded-carte border border-ligne bg-surface p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="titre-charte text-section">Coût des IA</h2>
        <span className={`text-sm font-semibold ${atteint ? "text-alerte" : ""}`}>
          {euros(total)} dépensés sur {euros(plafond)} {atteint ? "· plafond atteint, IA en pause" : ""}
        </span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-papier-fonce" role="progressbar" aria-valuenow={pourcent} aria-valuemin={0} aria-valuemax={100} aria-label="Part du plafond dépensée">
        <div className={`h-full rounded-full ${atteint ? "bg-alerte" : pourcent >= 80 ? "bg-accent" : "bg-bandeau"}`} style={{ width: `${pourcent}%` }} />
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-encre-douce">
            <th className="py-1 font-semibold">IA</th>
            <th className="py-1 text-right font-semibold">Appels</th>
            <th className="py-1 text-right font-semibold">Tokens</th>
            <th className="py-1 text-right font-semibold">Coût</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(NOMS).map(([ia, nom]) => {
            const p = parIA.get(ia) ?? { appels: 0, tokens: 0, cout: 0 };
            return (
              <tr key={ia} className="border-t border-ligne">
                <td className="py-1.5">{nom}</td>
                <td className="py-1.5 text-right tabular-nums">{p.appels}</td>
                <td className="py-1.5 text-right tabular-nums">{p.tokens.toLocaleString("fr-FR")}</td>
                <td className="py-1.5 text-right tabular-nums">{euros(p.cout)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <form action={changerPlafondIA} className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Plafond total (€)
          <input name="plafond" type="number" min={0} max={1000} step="0.5" defaultValue={plafond} className="min-h-11 w-32 rounded-ui border-2 border-ligne-forte bg-surface px-3 text-base font-normal outline-none focus:border-encre" />
        </label>
        <Bouton variante="contour">Régler le plafond</Bouton>
      </form>
      <p className="text-xs text-encre-douce">
        Estimation d&apos;après les tarifs publics du modèle servi (1 $ = 0,92 €). Plafond atteint : la relecture passe à l&apos;humain, le tri
        « Pour moi » revient aux règles, la lecture du CV et la rédaction se mettent en pause. Mettre 0 coupe toutes les IA.
      </p>
    </section>
  );
}
