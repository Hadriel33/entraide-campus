"use client";

import { useOptimistic, useState, useTransition } from "react";
import { basculerReaction } from "@/app/fil/actions";
import { REACTIONS, type ResumeReactions, type TypeReaction } from "@/lib/social/social";

// Pictogrammes dessinés (pas d'emoji : règle du test front-portable).
const ICONES: Record<TypeReaction, string> = {
  bravo: "M7 11V6.5a1.5 1.5 0 0 1 3 0V10m0-1.5V5a1.5 1.5 0 0 1 3 0v5m0-3.5a1.5 1.5 0 0 1 3 0V11m0-2a1.5 1.5 0 0 1 3 0v4.5A7.5 7.5 0 0 1 11.5 21h-.6a6 6 0 0 1-4.6-2.2L3.6 15.5a1.6 1.6 0 0 1 2.4-2.1L7 14.5",
  feu: "M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5.5 1-8.5Z",
  merci: "M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z",
  mdr: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 14.5c1 1.6 2.4 2.5 4 2.5s3-.9 4-2.5M8.5 9.5h.01M15.5 9.5h.01",
};

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
                if (!e.moi) setEnvol({ type: r.type, cle: Date.now() });
                basculer(r.type);
                await basculerReaction(cible, id, r.type, resume[r.type].moi);
              })
            }
            className="presse relative z-10 flex min-h-9 items-center gap-1.5 rounded-full border border-ligne-forte bg-surface px-2.5 text-sm font-semibold text-encre-douce hover:text-encre disabled:cursor-default disabled:opacity-70 aria-pressed:border-encre aria-pressed:bg-encre aria-pressed:text-surface"
          >
            <svg key={String(e.moi)} viewBox="0 0 24 24" className={`size-4 ${e.moi ? "pop" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d={ICONES[r.type]} />
            </svg>
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
