import type { SupabaseClient } from "@supabase/supabase-js";
import { BONUS_DEFI, defiDeLaSemaine } from "@/lib/gamification/defis";
import { joursRestants } from "@/lib/annonces/expiration";

// Défi de la semaine : le titre vient de la rotation (defis.ts), la progression de la base (mon_defi).
export async function CarteDefi({ supabase }: { supabase: SupabaseClient }) {
  const defi = defiDeLaSemaine();
  const { data } = await supabase.rpc("mon_defi");
  const {
    progression = 0,
    objectif = defi.objectif,
    fin,
  } = (data ?? {}) as { progression?: number; objectif?: number; fin?: string };
  const reussi = progression >= objectif;
  const jours = fin ? joursRestants(fin) : null;

  return (
    <section
      className={`apparition flex flex-col gap-3 rounded-carte border p-5 ${reussi ? "border-encre bg-offre" : "border-ligne bg-surface"}`}
      aria-label="Défi de la semaine"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-encre-douce">
          Défi de la semaine
        </p>
        <p className="text-xs text-encre-douce">
          +{BONUS_DEFI} points
          {jours !== null && ` · encore ${jours} jour${jours > 1 ? "s" : ""}`}
        </p>
      </div>
      <p className={`titre-charte text-2xl ${reussi ? "pop" : ""}`}>
        {reussi ? "Défi relevé !" : defi.titre}
      </p>
      <p className="text-sm">{defi.description}</p>
      <div className="flex items-center gap-3">
        <div
          className="h-2.5 flex-1 overflow-hidden rounded-full bg-papier-fonce"
          role="progressbar"
          aria-valuenow={progression}
          aria-valuemin={0}
          aria-valuemax={objectif}
        >
          <div
            className="h-full rounded-full bg-encre transition-[width] duration-700 ease-out"
            style={{
              width: `${Math.min(100, (progression / objectif) * 100)}%`,
            }}
          />
        </div>
        <span className="text-sm font-semibold">
          {Math.min(progression, objectif)} / {objectif}
        </span>
      </div>
    </section>
  );
}
