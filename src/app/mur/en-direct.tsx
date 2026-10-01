"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Colette } from "@/components/colette/colette";

// Écoute les annonces en temps réel (la RLS filtre ce que chacun reçoit) et relance
// la lecture côté serveur : le contenu de l'événement n'est jamais affiché tel quel.
export function EnDirect() {
  const router = useRouter();
  const [arrivees, setArrivees] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const canal = supabase
      .channel(`mur-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "annonces" }, (charge) => {
        if (charge.eventType === "INSERT") setArrivees((n) => n + 1);
        router.refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [router]);

  return (
    <p className="flex items-center gap-2 text-sm font-semibold" role="status">
      <span className="relative flex size-3" aria-hidden>
        <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-60" />
        <span className="relative size-3 rounded-full bg-accent" />
      </span>
      En direct
      {arrivees > 0 && (
        <span key={arrivees} className="pop flex items-center gap-2 -rotate-2 font-main text-lg text-alerte">
          <Colette anim="accroche" taille={56} />+{arrivees} depuis que tu regardes
        </span>
      )}
    </p>
  );
}

// Passe le mur en plein écran (pour le projeter pendant la démo).
export function BoutonProjection({ cible }: { cible: string }) {
  const [plein, setPlein] = useState(false);
  const etat = useRef(false);

  useEffect(() => {
    const surChangement = () => {
      etat.current = !!document.fullscreenElement;
      setPlein(etat.current);
    };
    document.addEventListener("fullscreenchange", surChangement);
    return () => document.removeEventListener("fullscreenchange", surChangement);
  }, []);

  return (
    <button
      type="button"
      onClick={() => (etat.current ? document.exitFullscreen() : document.getElementById(cible)?.requestFullscreen())}
      className="presse flex min-h-10 items-center gap-2 rounded-ui border border-encre bg-surface px-3 text-sm font-semibold hover:bg-papier-fonce"
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {plein ? <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /> : <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />}
      </svg>
      {plein ? "Quitter" : "Mode projection"}
    </button>
  );
}
