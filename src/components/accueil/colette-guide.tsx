"use client";

import { useEffect, useState } from "react";
import { Colette, type AnimColette } from "@/components/colette/colette";

type Arret = { texte: string; cote: "gauche" | "droite"; anim: AnimColette };

// Colette fait visiter la page d'accueil : à chaque section qui arrive au milieu de l'écran, elle traverse
// (en marchant) du côté indiqué et commente dans sa bulle. Les sections portent data-colette, data-cote et
// data-anim. Elle se cache pendant l'affiche (la Colette de l'affiche est déjà là) et on peut la faire taire.
export function ColetteGuide() {
  const [arret, setArret] = useState<Arret | null>(null);
  const [chut, setChut] = useState(false);
  // Sur téléphone, la bulle se replie après quelques secondes pour ne pas cacher le texte (Colette reste).
  const [repliee, setRepliee] = useState<string | null>(null);
  const texte = arret?.texte ?? null;
  useEffect(() => {
    if (!texte || !window.matchMedia("(max-width: 639px)").matches) return;
    const t = window.setTimeout(() => setRepliee(texte), 3500);
    return () => window.clearTimeout(t);
  }, [texte]);
  const bulle = repliee !== texte;

  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-colette]")];
    const observateur = new IntersectionObserver(
      (entrees) => {
        // La section la plus visible au milieu de l'écran l'emporte ; aucune : Colette se cache.
        const visible = entrees.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const d = (visible.target as HTMLElement).dataset;
          setArret({ texte: d.colette ?? "", cote: d.cote === "gauche" ? "gauche" : "droite", anim: (d.anim as AnimColette) ?? "coucou" });
        } else if (entrees.every((e) => !e.isIntersecting) && window.scrollY < 300) {
          setArret(null);
        }
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => observateur.observe(s));
    return () => observateur.disconnect();
  }, []);

  if (chut) return null;
  const gauche = arret?.cote === "gauche";

  return (
    <div
      aria-live="polite"
      className={`pointer-events-none fixed bottom-4 z-30 flex items-end gap-1 transition-[left,translate,opacity] duration-700 ease-in-out motion-reduce:transition-none sm:bottom-6 ${
        gauche ? "left-3 sm:left-6" : "left-[calc(100%-15rem)] sm:left-[calc(100%-22rem)]"
      } ${arret ? "translate-y-0 opacity-100" : "translate-y-40 opacity-0"}`}
    >
      {/* Elle marche quand elle change de côté (la clé relance les petits pas). */}
      <span
        key={`${arret?.cote}-${arret?.texte}`}
        className={`colette-pas-court flex shrink-0 items-center justify-center rounded-full bg-surface p-1 shadow-[3px_3px_0_0_var(--color-encre)] ring-2 ring-encre ${gauche ? "order-1" : "order-2"}`}
      >
        <Colette anim={arret?.anim ?? "coucou"} saison={false} taille={64} titre="Colette, la guide" className="sm:hidden" />
        <Colette anim={arret?.anim ?? "coucou"} saison={false} taille={92} titre="Colette, la guide" className="hidden sm:block" />
      </span>
      {arret && bulle && (
        <p
          key={arret.texte}
          className={`pop pointer-events-auto relative mb-10 max-w-[9.5rem] rounded-carte border-2 border-encre bg-surface px-3 py-2 font-main text-base leading-snug shadow-[3px_3px_0_0_var(--color-bandeau)] sm:mb-14 sm:max-w-[13rem] sm:text-lg ${
            gauche ? "order-2" : "order-1"
          }`}
        >
          {arret.texte}
          <button
            type="button"
            onClick={() => setChut(true)}
            aria-label="Faire taire Colette"
            className="absolute -top-3 -right-3 flex size-6 items-center justify-center rounded-full border-2 border-encre bg-surface font-sans text-xs font-bold hover:bg-papier-fonce"
          >
            ×
          </button>
        </p>
      )}
    </div>
  );
}
