"use client";

import { useActionState, useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import { analyserCV, enregistrerCompetences, type EtatCV } from "./actions";

// IA n°1 : l'IA propose, l'étudiant relit, corrige et valide. Rien n'est enregistré sans son clic.
export function AssistantCompetences({ actuelles }: { actuelles: string[] }) {
  const [etat, analyser, analyseEnCours] = useActionState<EtatCV, FormData>(analyserCV, {});
  const [choisies, setChoisies] = useState<string[]>(actuelles);
  const [ajout, setAjout] = useState("");
  const [enregistrement, demarrer] = useTransition();
  const [dejaVues, setDejaVues] = useState<string[] | undefined>(undefined);

  // Nouvelles propositions de l'IA : on les ajoute (cochées) à la liste à relire.
  if (etat.propositions && etat.propositions !== dejaVues) {
    setDejaVues(etat.propositions);
    setChoisies((c) => [...c, ...etat.propositions!.filter((p) => !c.some((x) => x.toLowerCase() === p.toLowerCase()))].slice(0, 15));
  }
  const propositionsIA = new Set((etat.propositions ?? []).map((p) => p.toLowerCase()));
  const toutes = [...new Set([...choisies, ...(etat.propositions ?? [])])];

  const basculer = (c: string) => setChoisies((liste) => (liste.includes(c) ? liste.filter((x) => x !== c) : [...liste, c].slice(0, 15)));
  const ajouter = () => {
    const c = ajout.trim();
    if (c.length >= 2 && c.length <= 40 && !choisies.some((x) => x.toLowerCase() === c.toLowerCase())) setChoisies((l) => [...l, c].slice(0, 15));
    setAjout("");
  };

  return (
    <div className="flex flex-col gap-4">
      <form action={analyser} className="flex flex-wrap items-center gap-3 rounded-ui border border-dashed border-ligne-forte p-4">
        <label className="presse inline-flex min-h-10 cursor-pointer items-center rounded-ui border border-ligne-forte bg-surface px-4 py-2 text-sm font-semibold hover:bg-papier-fonce">
          Choisir mon CV (PDF)
          <input type="file" name="cv" accept="application/pdf" className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        </label>
        <span className="text-xs text-encre-douce">
          L&apos;IA lit ton CV et propose tes compétences. Ton CV n&apos;est pas conservé.
        </span>
        {analyseEnCours && (
          <span role="status" className="flex items-center gap-2 text-sm font-medium">
            <span className="size-3 animate-ping rounded-full bg-bandeau" aria-hidden />
            L&apos;IA lit ton CV...
          </span>
        )}
      </form>

      {etat.erreur && (
        <p role="alert" className="text-sm text-alerte">
          {etat.erreur}
        </p>
      )}
      {etat.message && <p className="pop text-sm">{etat.message}</p>}

      {toutes.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Compétences : clique pour garder ou retirer">
          {toutes.map((c, i) => {
            const garde = choisies.includes(c);
            return (
              <li key={c} className="apparition" style={{ "--i": i } as React.CSSProperties}>
                <button
                  type="button"
                  onClick={() => basculer(c)}
                  aria-pressed={garde}
                  className={`presse flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm ${
                    garde ? "border-encre bg-offre font-medium" : "border-dashed border-ligne-forte text-encre-douce line-through"
                  }`}
                >
                  {c}
                  {propositionsIA.has(c.toLowerCase()) && <span className="text-[10px] font-semibold uppercase text-encre-douce">IA</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={ajout}
          onChange={(e) => setAjout(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              ajouter();
            }
          }}
          maxLength={40}
          placeholder="Ajouter une compétence à la main"
          aria-label="Ajouter une compétence"
          className="min-h-10 flex-1 rounded-ui border border-ligne-forte bg-surface px-3 text-sm outline-none focus:border-encre"
        />
        <Bouton type="button" variante="contour" onClick={ajouter}>
          Ajouter
        </Bouton>
      </div>

      <div className="flex items-center gap-3">
        <Bouton disabled={enregistrement} onClick={() => demarrer(() => enregistrerCompetences(choisies))}>
          {enregistrement ? "Enregistrement..." : `Enregistrer ${choisies.length} compétence${choisies.length > 1 ? "s" : ""}`}
        </Bouton>
        <span className="text-xs text-encre-douce">{choisies.length} / 15</span>
      </div>
    </div>
  );
}
