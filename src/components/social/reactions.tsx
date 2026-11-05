"use client";

import { useOptimistic, useState, useTransition } from "react";
import { basculerReaction } from "@/app/fil/actions";
import { COLETTE_REACTION, REACTIONS, type ResumeReactions, type TypeReaction } from "@/lib/social/social";
import { Colette } from "@/components/colette/colette";
import { faireReagirColette } from "@/lib/colette/reactions";

// Chaque réaction a sa tête de Colette (les « emoji » de l'appli, cf. COLETTE_REACTION).

// Réactions instantanées (optimistes) ; elles ne rapportent aucun point, donc rien à gagner à tricher.
export function Reactions({
  cible,
  id,
  resume,
  proprietaire = false,
}: {
  cible: "annonce" | "entraide";
  id: string;
  resume: ResumeReactions;
  proprietaire?: boolean;
}) {
  const [affiche, basculer] = useOptimistic(resume, (etat, type: TypeReaction) => ({
    ...etat,
    [type]: { n: etat[type].n + (etat[type].moi ? -1 : 1), moi: !etat[type].moi },
  }));
  const [, demarrer] = useTransition();
  // Le « +1 » qui s'envole : la clé change à chaque clic pour relancer l'animation.
  const [envol, setEnvol] = useState<{ type: TypeReaction; cle: number } | null>(null);

  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Réactions">
      {REACTIONS.map((r) => {
        const e = affiche[r.type];
        return (
          <button
            key={r.type}
            type="button"
            disabled={proprietaire}
            aria-pressed={e.moi}
            title={proprietaire ? "Les autres réagissent à tes posts" : r.label}
            onClick={() =>
              demarrer(async () => {
                if (!e.moi) {
                  setEnvol({ type: r.type, cle: Date.now() });
                  faireReagirColette("reaction");
                }
                basculer(r.type);
                await basculerReaction(cible, id, r.type, resume[r.type].moi);
              })
            }
            className="presse relative z-10 flex min-h-9 items-center gap-1.5 rounded-full border border-ligne-forte bg-surface px-2.5 text-sm font-semibold text-encre-douce hover:text-encre disabled:cursor-default disabled:opacity-70 aria-pressed:border-encre aria-pressed:bg-encre aria-pressed:text-surface"
          >
            <span key={String(e.moi)} className={`flex ${e.moi ? "pop" : ""}`} aria-hidden>
              <Colette tete humeur={COLETTE_REACTION[r.type].humeur} accessoire={COLETTE_REACTION[r.type].accessoire} saison={false} taille={26} />
            </span>
            <span className="sr-only">{r.label}</span>
            {e.n > 0 && <span key={e.n} className="pop">{e.n}</span>}
            {envol?.type === r.type && (
              <span key={envol.cle} className="envol absolute -top-2 right-0 font-main text-lg leading-none text-accent" aria-hidden>
                +1
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
