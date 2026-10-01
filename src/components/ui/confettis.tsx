"use client";

import { useSearchParams } from "next/navigation";

// Pluie de confettis aux couleurs de la charte quand il se passe quelque chose de bien.
// Pur CSS : positions calculées à partir de l'index (pas d'aléatoire au rendu), et rien
// ne s'affiche si l'utilisateur a demandé à réduire les animations.
const MOMENTS = new Set(["acceptee", "publiee", "avis", "bienvenue"]);
const COULEURS = ["bg-bandeau", "bg-lilas", "bg-ciel", "bg-ocre", "bg-accent", "bg-encre"];
const NOMBRE = 56;

export function Confettis() {
  const code = useSearchParams().get("ok");
  if (!code || !MOMENTS.has(code)) return null;

  return (
    <div key={code} className="pointer-events-none fixed inset-0 z-40 overflow-hidden motion-reduce:hidden" aria-hidden>
      {Array.from({ length: NOMBRE }, (_, i) => {
        const x = (i * 37) % 100;
        const large = i % 3 === 0;
        return (
          <span
            key={i}
            className={`confetti ${COULEURS[i % COULEURS.length]} ${large ? "h-2.5 w-4" : "h-3.5 w-1.5"} ${i % 4 === 0 ? "rounded-full" : "rounded-[1px]"}`}
            style={
              {
                left: `${x}%`,
                "--dx": `${((i * 53) % 40) - 20}vw`,
                "--tour": `${((i * 97) % 720) + 180}deg`,
                "--delai": `${(i * 29) % 600}ms`,
                "--duree": `${2 + ((i * 13) % 14) / 10}s`,
              } as React.CSSProperties
            }
          />
        );
      })}
    </div>
  );
}
