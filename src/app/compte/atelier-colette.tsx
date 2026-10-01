"use client";

import { useState } from "react";
import { Colette, type Accessoire, type CouleurColette, type Humeur, type Motif } from "@/components/colette/colette";
import { Bouton } from "@/components/ui/bouton";
import { ACCESSOIRES_COLETTE, COULEURS_COLETTE, HUMEURS_COLETTE, MOTIFS_COLETTE, estDebloque } from "@/lib/profils/colette";
import type { Stats } from "@/lib/gamification/progression";
import { enregistrerColette } from "./actions";

const PASTILLE: Record<string, string> = { jaune: "bg-postit-jaune", lilas: "bg-postit-lilas", ciel: "bg-postit-ciel", ocre: "bg-postit-ocre" };

function Cadenas() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

const PUCE =
  "presse flex cursor-pointer items-center gap-1.5 rounded-full border border-ligne-forte bg-surface px-3 py-1.5 text-sm font-semibold has-[:checked]:border-encre has-[:checked]:bg-encre has-[:checked]:text-surface has-[:disabled]:cursor-not-allowed has-[:disabled]:border-dashed has-[:disabled]:bg-papier-fonce has-[:disabled]:text-encre-douce";

function Choix({
  groupe,
  liste,
  valeur,
  changer,
  stats,
  indice,
}: {
  groupe: string;
  liste: typeof ACCESSOIRES_COLETTE;
  valeur: string;
  changer: (v: string) => void;
  stats: Stats | null;
  indice: (texte: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(liste).map(([v, o]) => {
        const ok = estDebloque(o, stats);
        return (
          <label
            key={v}
            className={PUCE}
            title={ok ? o.nom : `${o.nom} : ${o.aide}`}
            onMouseEnter={() => !ok && indice(`${o.nom} : ${o.aide?.toLowerCase()}`)}
            onMouseLeave={() => indice(null)}
          >
            <input type="radio" name={groupe} value={v} checked={valeur === v} disabled={!ok} onChange={() => changer(v)} className="sr-only" />
            {!ok && <Cadenas />}
            {o.nom}
            {!ok && <span className="sr-only">(à débloquer : {o.aide})</span>}
          </label>
        );
      })}
    </div>
  );
}

// « Crée ta Colette » : couleur, humeur, tenue et motif. Les pièces rares se débloquent en s'entraidant
// (la base refuse aussi un objet verrouillé). Aperçu en direct, enregistré au clic.
export function AtelierColette({
  couleur,
  humeur,
  accessoire,
  motif,
  stats,
}: {
  couleur: string;
  humeur: string;
  accessoire: string;
  motif: string;
  stats: Stats | null;
}) {
  const [c, setC] = useState(couleur || "jaune");
  const [h, setH] = useState(humeur || "contente");
  const [a, setA] = useState(accessoire || "aucun");
  const [m, setM] = useState(motif || "uni");
  const [survol, setSurvol] = useState<string | null>(null);

  const debloques = Object.values(ACCESSOIRES_COLETTE).filter((o) => o.condition && estDebloque(o, stats)).length + Object.values(MOTIFS_COLETTE).filter((o) => o.condition && estDebloque(o, stats)).length;
  const aGagner = Object.values(ACCESSOIRES_COLETTE).filter((o) => o.condition).length + Object.values(MOTIFS_COLETTE).filter((o) => o.condition).length;


  return (
    <form action={enregistrerColette} className="grid items-start gap-6 sm:grid-cols-[200px_minmax(0,1fr)]">
      <div className="flex flex-col items-center gap-3 sm:sticky sm:top-6">
        <div className="flex w-full justify-center rounded-carte bg-papier-fonce pt-6 pb-4">
          <Colette
            key={`${c}${h}${a}${m}`}
            couleur={c as CouleurColette}
            humeur={h as Humeur}
            accessoire={a as Accessoire}
            motif={m as Motif}
            saison={false}
            anim="flotte"
            taille={150}
            titre="Aperçu de ta Colette"
          />
        </div>
        <p className="text-center text-xs text-encre-douce">
          {debloques} / {aGagner} pièces rares débloquées
        </p>
        <p className="min-h-6 -rotate-1 text-center font-main text-lg leading-tight text-alerte" aria-live="polite">
          {survol}
        </p>
      </div>
      <div className="flex flex-col gap-5">
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
              <label key={v} className={PUCE}>
                <input type="radio" name="humeur" value={v} checked={h === v} onChange={() => setH(v)} className="sr-only" />
                {l}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Tenue</legend>
          <Choix groupe="accessoire" liste={ACCESSOIRES_COLETTE} valeur={a} changer={setA} stats={stats} indice={setSurvol} />
        </fieldset>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Motif du papier</legend>
          <Choix groupe="motif" liste={MOTIFS_COLETTE} valeur={m} changer={setM} stats={stats} indice={setSurvol} />
        </fieldset>
        <p className="text-xs text-encre-douce">Les pièces avec un cadenas se gagnent en s&apos;entraidant. Passe la souris dessus pour savoir comment.</p>
        <Bouton className="self-start">Garder cette Colette</Bouton>
      </div>
    </form>
  );
}
