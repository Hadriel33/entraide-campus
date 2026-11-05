"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { Colette, type Accessoire, type CouleurColette, type Humeur, type Motif } from "./colette";
import { PluieConfettis } from "@/components/ui/confettis";
import { nouvellesPieces, type PieceGagnee } from "@/lib/colette/recompenses";

// « Colette gagne une tenue » : la première fois qu'une pièce gagnée apparaît, Colette l'enfile devant moi.
// Ce qui a déjà été fêté est retenu sur l'appareil (stockage local) ; s'il est bloqué, on ne fête rien.
const EVENEMENT = "postit-tenues";

function lire(cle: string) {
  try {
    return localStorage.getItem(cle);
  } catch {
    return "bloque";
  }
}
function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  return () => window.removeEventListener(EVENEMENT, rappel);
}

export function TenueGagnee({ moi, pieces, couleur, humeur, accessoire, motif }: { moi: string; pieces: PieceGagnee[]; couleur: string; humeur: string; accessoire: string; motif: string }) {
  const cle = `postit-tenues-${moi}`;
  const brut = useSyncExternalStore(abonner, () => lire(cle), () => "bloque");
  const codes = pieces.map((p) => p.code);
  const vues = brut === "bloque" ? codes : brut ? (JSON.parse(brut) as string[]) : null;
  const a_feter = nouvellesPieces(codes, vues);
  const piece = pieces.find((p) => p.code === a_feter[0]);

  // Première visite : on retient ce qui est déjà gagné, sans fête.
  useEffect(() => {
    if (brut === null) {
      try {
        localStorage.setItem(cle, JSON.stringify(codes));
      } catch {}
    }
  }, [brut, cle, codes]);

  if (!piece) return null;
  const fermer = () => {
    try {
      localStorage.setItem(cle, JSON.stringify(codes));
    } catch {}
    window.dispatchEvent(new Event(EVENEMENT));
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="tenue-titre" className="fixed inset-0 z-50 flex items-center justify-center p-4" onKeyDown={(e) => e.key === "Escape" && fermer()}>
      <button type="button" aria-label="Fermer" onClick={fermer} className="fondu absolute inset-0 bg-encre/45" />
      <PluieConfettis z="z-50" />
      <div className="pop relative z-50 flex w-full max-w-sm flex-col items-center gap-4 rounded-carte border-2 border-encre bg-surface p-6 text-center shadow-[6px_6px_0_0_var(--color-bandeau)]">
        <span className="rounded-full bg-bandeau px-3 py-1 text-xs font-bold tracking-[0.14em] uppercase">Nouvelle tenue</span>
        <div className="flex w-full justify-center rounded-carte bg-papier-fonce pt-6 pb-3">
          <Colette
            anim="saute"
            couleur={(couleur || "jaune") as CouleurColette}
            humeur={(humeur || "fiere") as Humeur}
            accessoire={(piece.type === "accessoire" ? piece.valeur : accessoire || "aucun") as Accessoire}
            motif={(piece.type === "motif" ? piece.valeur : motif || "uni") as Motif}
            saison={false}
            taille={140}
            titre={`Colette avec : ${piece.nom}`}
          />
        </div>
        <h2 id="tenue-titre" className="titre-charte text-2xl leading-tight">
          Colette a gagné : {piece.nom} !
        </h2>
        <p className="text-[0.95rem] leading-snug text-encre-douce">Tu l&apos;as gagnée en participant : {piece.aide.toLowerCase()}.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/compte#colette" onClick={fermer} className="presse rounded-ui bg-encre px-4 py-2.5 font-semibold text-surface hover:-translate-y-0.5">
            L&apos;enfiler
          </Link>
          <button type="button" onClick={fermer} autoFocus className="presse rounded-ui border border-ligne-forte px-4 py-2.5 font-semibold hover:border-encre">
            Plus tard
          </button>
        </div>
      </div>
    </div>
  );
}
