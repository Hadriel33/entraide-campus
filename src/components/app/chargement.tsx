"use client";

import { usePathname } from "next/navigation";
import { Colette } from "@/components/colette/colette";
import { chargementDiscret } from "@/lib/chargement";

// Écran de chargement. Dans l'appli : Colette réfléchit pendant que la page arrive, sur des post-its fantômes.
// Avant connexion (accueil, connexion, inscription) : une simple barre, car il n'y a rien à chercher.
export function Chargement() {
  const chemin = usePathname();
  if (chargementDiscret(chemin)) {
    return (
      <div className="mx-auto w-full max-w-6xl pt-6" aria-busy="true" aria-label="Chargement">
        <div className="h-1 w-40 animate-pulse rounded-full bg-bandeau" />
      </div>
    );
  }
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8" aria-busy="true" aria-label="Chargement">
      <div className="flex items-end gap-4">
        <Colette anim="reflechit" taille={90} />
        <p className="-rotate-2 pb-4 font-main text-2xl text-encre-douce">deux secondes, je cherche...</p>
      </div>
      <div className="grid animate-pulse gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="postit papier-gris h-48 opacity-70" style={{ "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
