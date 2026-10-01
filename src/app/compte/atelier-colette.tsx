"use client";

import { useState } from "react";
import { Colette, type Accessoire, type CouleurColette, type Humeur } from "@/components/colette/colette";
import { Bouton } from "@/components/ui/bouton";
import { ACCESSOIRES_COLETTE, COULEURS_COLETTE, HUMEURS_COLETTE } from "@/lib/profils/colette";
import { enregistrerColette } from "./actions";

const PASTILLE: Record<string, string> = { jaune: "bg-postit-jaune", lilas: "bg-postit-lilas", ciel: "bg-postit-ciel", ocre: "bg-postit-ocre" };

// « Crée ta Colette » : ton avatar quand tu n'as pas de photo. Aperçu en direct, enregistré au clic.
export function AtelierColette({ couleur, humeur, accessoire }: { couleur: string; humeur: string; accessoire: string }) {
  const [c, setC] = useState(couleur || "jaune");
  const [h, setH] = useState(humeur || "contente");
  const [a, setA] = useState(accessoire || "aucun");

  const choix = "presse rounded-full border border-ligne-forte bg-surface px-3 py-1.5 text-sm font-semibold has-[:checked]:border-encre has-[:checked]:bg-encre has-[:checked]:text-surface";

  return (
    <form action={enregistrerColette} className="grid items-center gap-6 sm:grid-cols-[180px_minmax(0,1fr)]">
      <div className="flex justify-center rounded-carte bg-papier-fonce py-4">
        <Colette key={`${c}${h}${a}`} couleur={c as CouleurColette} humeur={h as Humeur} accessoire={a as Accessoire} anim="flotte" taille={140} titre="Aperçu de ta Colette" />
      </div>
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Couleur</legend>
          <div className="flex gap-2">
            {Object.entries(COULEURS_COLETTE).map(([v, l]) => (
              <label key={v} className={`presse size-10 cursor-pointer rounded-ui border-2 ${PASTILLE[v]} ${c === v ? "border-encre" : "border-transparent"}`}>
                <input type="radio" name="couleur" value={v} checked={c === v} onChange={() => setC(v)} className="sr-only" />
                <span className="sr-only">{l}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Humeur</legend>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(HUMEURS_COLETTE).map(([v, l]) => (
              <label key={v} className={choix}>
                <input type="radio" name="humeur" value={v} checked={h === v} onChange={() => setH(v)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Accessoire</legend>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(ACCESSOIRES_COLETTE).map(([v, l]) => (
              <label key={v} className={choix}>
                <input type="radio" name="accessoire" value={v} checked={a === v} onChange={() => setA(v)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <Bouton className="self-start">Garder cette Colette</Bouton>
      </div>
    </form>
  );
}
