"use client";

import { useOptimistic, useTransition } from "react";
import { basculerFavori } from "@/app/favoris/actions";

// Favori instantané : le cœur change tout de suite (optimiste), le serveur confirme derrière.
export function BoutonFavori({ annonceId, favori }: { annonceId: string; favori: boolean }) {
  const [affiche, setAffiche] = useOptimistic(favori);
  const [, demarrer] = useTransition();

  return (
    <button
      type="button"
      aria-pressed={affiche}
      aria-label={affiche ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={() =>
        demarrer(async () => {
          setAffiche(!affiche);
          await basculerFavori(annonceId, favori);
        })
      }
      className="presse flex min-h-10 items-center gap-2 rounded-ui border border-ligne-forte bg-surface px-3 text-sm font-semibold hover:bg-papier-fonce aria-pressed:border-accent aria-pressed:text-accent"
    >
      <svg key={String(affiche)} viewBox="0 0 24 24" className={`size-5 ${affiche ? "pop" : ""}`} fill={affiche ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
        <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.4 8 3.6 4.5 7.1 4.5c2 0 3.6 1.1 4.9 2.8 1.3-1.7 2.9-2.8 4.9-2.8 3.5 0 5.7 3.5 4.4 6.8-1.8 4.6-9.3 9.2-9.3 9.2z" />
      </svg>
      {affiche ? "Dans tes favoris" : "Favori"}
    </button>
  );
}
