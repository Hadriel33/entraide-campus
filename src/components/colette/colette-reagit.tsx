"use client";

import { useEffect, useRef, useState } from "react";
import { Colette } from "./colette";
import { EVENEMENT_REACTION, GESTES, HUMEUR_GESTE, phraseReaction, type Geste } from "@/lib/colette/reactions";

// Une mini-Colette surgit une seconde quand je soutiens, réagis ou commente. Rien à fermer, rien de stocké.
export function ColetteReagit() {
  const [moment, setMoment] = useState<{ geste: Geste; n: number } | null>(null);
  const compteur = useRef(0);
  const minuterie = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const surGeste = (e: Event) => {
      const geste = (e as CustomEvent).detail as Geste;
      if (!GESTES.includes(geste)) return;
      compteur.current += 1;
      setMoment({ geste, n: compteur.current });
      if (minuterie.current) clearTimeout(minuterie.current);
      minuterie.current = setTimeout(() => setMoment(null), 1800);
    };
    window.addEventListener(EVENEMENT_REACTION, surGeste);
    return () => {
      window.removeEventListener(EVENEMENT_REACTION, surGeste);
      if (minuterie.current) clearTimeout(minuterie.current);
    };
  }, []);

  if (!moment) return null;
  return (
    <div key={moment.n} role="status" className="reagit pointer-events-none fixed bottom-24 left-4 z-50 flex items-end gap-1.5 md:bottom-6 md:left-[17.5rem]">
      <Colette humeur={HUMEUR_GESTE[moment.geste]} anim={moment.geste === "reaction" ? "danse" : "saute"} saison={false} taille={58} />
      <span className="mb-8 rounded-carte border border-encre bg-surface px-3 py-1.5 font-main text-lg leading-none shadow-[2px_2px_0_0_var(--color-bandeau)]">
        {phraseReaction(moment.geste, moment.n)}
      </span>
    </div>
  );
}
