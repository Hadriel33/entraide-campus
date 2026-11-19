"use client";
import { BadgeIA } from "@/components/ia/badge-ia";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { Bouton } from "@/components/ui/bouton";
import { analyserCV, sauverCompetences, type EtatCV } from "./actions";
import { Colette } from "@/components/colette/colette";

// IA n°1 : l'IA propose, l'étudiant garde ce qui est juste. Ses ajouts et retraits s'enregistrent tout seuls ;
// les propositions de l'IA restent à part tant qu'il ne les a pas gardées (clic sur la proposition ou « Tout garder »).
export function AssistantCompetences({ actuelles }: { actuelles: string[] }) {
  const [etat, analyser, analyseEnCours] = useActionState<EtatCV, FormData>(analyserCV, {});
  const [choisies, setChoisies] = useState<string[]>(actuelles);
  const [ajout, setAjout] = useState("");
  const [enregistrement, demarrer] = useTransition();
  const [statut, setStatut] = useState<"" | "ok" | "erreur">("");
  const modifie = useRef(false);

  // Enregistrement automatique, 700 ms après la dernière modification faite par l'étudiant.
  useEffect(() => {
    if (!modifie.current) return;
    const t = window.setTimeout(() => {
      demarrer(async () => {
        const r = await sauverCompetences(choisies);
        setStatut(r.ok ? "ok" : "erreur");
      });
    }, 700);
    return () => window.clearTimeout(t);
  }, [choisies]);

  const changer = (f: (liste: string[]) => string[]) => {
    modifie.current = true;
    setStatut("");
    setChoisies((l) => f(l).slice(0, 15));
  };
  const memes = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const propositions = (etat.propositions ?? []).filter((p) => !choisies.some((c) => memes(c, p)));
  const retirer = (c: string) => changer((l) => l.filter((x) => x !== c));
  const garder = (c: string) => changer((l) => (l.some((x) => memes(x, c)) ? l : [...l, c]));
  const ajouter = () => {
    const c = ajout.trim();
    if (c.length >= 2 && c.length <= 40) garder(c);
    setAjout("");
  };

  return (
    <div className="flex flex-col gap-4">
      <form action={analyser} className="flex flex-wrap items-center gap-3 rounded-ui border border-dashed border-ligne-forte p-4">
        <label className="presse inline-flex min-h-10 cursor-pointer items-center rounded-ui border border-ligne-forte bg-surface px-4 py-2 text-sm font-semibold hover:bg-papier-fonce">
          Choisir mon CV (PDF)
          <input type="file" name="cv" accept="application/pdf" className="sr-only" onChange={(e) => e.currentTarget.form?.requestSubmit()} />
        </label>
        <span className="flex flex-wrap items-center gap-2 text-xs text-encre-douce">
          <BadgeIA numero={1} />
          Colette lit ton CV et propose tes compétences, tu valides. Ton CV n&apos;est pas conservé.
        </span>
      </form>
      {analyseEnCours && (
        <div role="status" className="pop flex items-center gap-5 rounded-carte bg-papier-fonce p-4">
          <Colette anim="lit" taille={110} className="shrink-0" />
          <div className="flex flex-col gap-1 font-main text-xl">
            <strong>Colette lit ton CV...</strong>
            <span className="apparition text-encre-douce" style={{ "--i": 6 } as React.CSSProperties}>je repère tes compétences</span>
            <span className="apparition text-encre-douce" style={{ "--i": 12 } as React.CSSProperties}>je les range par post-it</span>
            <span className="text-sm font-sans text-encre-douce">Ton CV n&apos;est pas conservé.</span>
          </div>
        </div>
      )}

      {etat.erreur && (
        <p role="alert" className="text-sm text-alerte">
          {etat.erreur}
        </p>
      )}
      {etat.message && <p className="pop text-sm">{etat.message}</p>}

      {/* Mes compétences, gardées : clic pour retirer. */}
      {choisies.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Mes compétences : clique pour retirer">
          {choisies.map((c, i) => (
            <li key={c} className="apparition" style={{ "--i": i } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => retirer(c)}
                title="Retirer"
                className="presse flex items-center gap-1.5 rounded-full border-2 border-encre bg-offre px-3.5 py-1.5 text-sm font-semibold hover:bg-papier-fonce"
              >
                {c}
                <span aria-hidden className="text-encre-douce">×</span>
                <span className="sr-only">(retirer)</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Les propositions de l'IA attendent le clic de l'étudiant. */}
      {propositions.length > 0 && (
        <div className="pop flex flex-col gap-2 rounded-carte border border-dashed border-ligne-forte bg-surface p-3">
          <p className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold">
            <span className="flex items-center gap-2"><BadgeIA numero={1} />Colette propose (clique pour garder)</span>
            <button type="button" onClick={() => changer((l) => [...l, ...propositions])} className="text-sm font-semibold underline decoration-2 underline-offset-4 hover:decoration-bandeau">
              Tout garder
            </button>
          </p>
          <ul className="flex flex-wrap gap-2">
            {propositions.map((c) => (
              <li key={c}>
                <button type="button" onClick={() => garder(c)} className="presse rounded-full border border-dashed border-ligne-forte px-3 py-1.5 text-sm text-encre-douce hover:border-encre hover:text-encre">
                  + {c}
                </button>
              </li>
            ))}
          </ul>
        </div>
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

      <p className="text-xs text-encre-douce" aria-live="polite">
        {choisies.length} / 15 ·{" "}
        {enregistrement ? "Enregistrement..." : statut === "ok" ? "Enregistré automatiquement" : statut === "erreur" ? "Pas enregistré, réessaie" : "Enregistré automatiquement à chaque changement"}
      </p>
    </div>
  );
}
