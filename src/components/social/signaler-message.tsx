"use client";

import { useState, useTransition } from "react";
import { signalerMessage } from "@/app/fil/actions";
import { MOTIFS_SIGNALEMENT, type CibleSignalement } from "@/lib/social/signalement";

// « Signaler » sous un commentaire ou un message de salon : discret, un motif, et c'est envoyé à l'admin.
export function SignalerMessage({ cible, id, clair = false }: { cible: CibleSignalement; id: string; clair?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const [retour, setRetour] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  if (retour) return <span className={`text-[11px] font-semibold ${clair ? "text-surface/80" : "text-ok"}`}>{retour}</span>;
  if (!ouvert)
    return (
      <button type="button" onClick={() => setOuvert(true)} className={`text-[11px] font-semibold hover:underline ${clair ? "text-surface/60 hover:text-surface" : "text-encre-douce hover:text-alerte"}`}>
        Signaler
      </button>
    );
  return (
    <form
      className="pop flex flex-wrap items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const motif = String(new FormData(e.currentTarget).get("motif") ?? "");
        demarrer(async () => setRetour((await signalerMessage(cible, id, motif)).message));
      }}
    >
      <label className="sr-only" htmlFor={`signal-${id}`}>
        Motif du signalement
      </label>
      <select id={`signal-${id}`} name="motif" required defaultValue="" className="min-h-8 rounded-ui border border-ligne-forte bg-surface px-2 text-xs text-encre">
        <option value="" disabled>
          Pourquoi ?
        </option>
        {Object.entries(MOTIFS_SIGNALEMENT).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button disabled={enCours} className="presse min-h-8 rounded-ui bg-alerte px-2.5 text-xs font-semibold text-surface disabled:opacity-60">
        {enCours ? "..." : "Envoyer"}
      </button>
      <button type="button" onClick={() => setOuvert(false)} className={`text-xs ${clair ? "text-surface/70" : "text-encre-douce"}`}>
        Annuler
      </button>
    </form>
  );
}
