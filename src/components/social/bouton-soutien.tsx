"use client";

import { useOptimistic, useState, useTransition } from "react";
import { basculerSoutien } from "@/app/fil/actions";
import type { ResumeSoutien } from "@/lib/social/soutiens";

// « Je soutiens » : la flèche bondit, un « +1 » s'envole, le compteur saute. Optimiste : l'écran répond tout de suite,
// la base tranche ensuite (pas sur son propre post-it, un seul soutien par personne).
export function BoutonSoutien({
  annonceId,
  resume,
  proprietaire = false,
  grand = false,
}: {
  annonceId: string;
  resume: ResumeSoutien;
  proprietaire?: boolean;
  grand?: boolean;
}) {
  const [affiche, basculer] = useOptimistic(resume, (e) => ({ n: e.n + (e.moi ? -1 : 1), moi: !e.moi }));
  const [, demarrer] = useTransition();
  const [elan, setElan] = useState(0);

  const libelle = proprietaire ? "Soutiens reçus" : affiche.moi ? "Tu soutiens ce post-it (retirer)" : "Je soutiens ce post-it";
  return (
    <button
      type="button"
      disabled={proprietaire}
      aria-pressed={affiche.moi}
      aria-label={`${libelle} : ${affiche.n}`}
      title={proprietaire ? "Les autres soutiennent ton post-it pour le faire monter" : "Fais monter ce post-it"}
      onClick={() =>
        demarrer(async () => {
          if (!affiche.moi) setElan(Date.now());
          basculer(null);
          await basculerSoutien(annonceId, resume.moi);
        })
      }
      className={`presse relative z-10 inline-flex items-center gap-1.5 rounded-full border-[1.5px] border-encre font-bold disabled:cursor-default aria-pressed:bg-encre aria-pressed:text-surface ${
        grand ? "min-h-11 px-4 text-base" : "min-h-9 px-2.5 text-sm"
      } ${affiche.moi ? "" : "bg-surface/80 hover:bg-bandeau"}`}
    >
      <svg key={elan} viewBox="0 0 24 24" className={`${grand ? "size-5" : "size-4"} ${elan ? "bond" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
      {grand && <span>{proprietaire ? "Soutiens" : affiche.moi ? "Soutenu" : "Je soutiens"}</span>}
      <span key={affiche.n} className="pop tabular-nums">{affiche.n}</span>
      {elan > 0 && (
        <span key={`e${elan}`} className="envol absolute -top-3 right-0 font-main text-lg leading-none text-accent" aria-hidden>
          +1
        </span>
      )}
    </button>
  );
}
