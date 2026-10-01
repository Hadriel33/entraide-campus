"use client";

import { useActionState } from "react";
import { Colette } from "@/components/colette/colette";
import { Bouton } from "@/components/ui/bouton";
import { FormulaireAnnonce } from "./formulaire-annonce";
import { redigerAvecColette, type EtatAnnonce, type EtatRedaction } from "@/app/annonces/actions";

type Action = (etat: EtatAnnonce, formData: FormData) => Promise<EtatAnnonce>;

// Colette rédactrice : une phrase, et elle remplit le formulaire. L'étudiant relit tout avant de publier.
export function AssistantRedaction({ action, initial }: { action: Action; initial: Record<string, string> }) {
  const [etat, rediger, enCours] = useActionState<EtatRedaction, FormData>(redigerAvecColette, {});
  const valeurs = etat.brouillon ? { ...initial, ...etat.brouillon } : initial;

  return (
    <div className="flex flex-col gap-8">
      <form action={rediger} className="couche-fixe teinte-lilas flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-5">
        <div className="flex items-center gap-3">
          <Colette anim={enCours ? "reflechit" : "coucou"} taille={64} className="shrink-0" />
          <div>
            <p className="font-main text-2xl leading-tight">Pas envie de tout remplir ?</p>
            <p className="text-sm text-encre-douce">Décris ton idée en une phrase, Colette écrit l&apos;annonce. Tu relis avant de publier.</p>
          </div>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="sr-only">Ton idée en une phrase</span>
          <textarea
            name="idee"
            rows={2}
            maxLength={400}
            defaultValue={etat.idee}
            placeholder="Ex. : je fais des photos de soirées pour les assos, gratuit, je suis vers Victor Hugo"
            className="rounded-ui border border-ligne-forte bg-papier px-3 py-2 text-base outline-none focus:border-encre focus:bg-surface"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Bouton disabled={enCours}>{enCours ? "Colette écrit..." : "Colette, écris-la pour moi"}</Bouton>
          {etat.erreur && (
            <p role="alert" className="text-sm text-alerte">
              {etat.erreur}
            </p>
          )}
          {etat.brouillon && !enCours && (
            <p role="status" className="pop -rotate-1 font-main text-lg text-alerte">
              voilà ! relis et corrige ce qu&apos;il faut ci-dessous
            </p>
          )}
        </div>
      </form>

      {/* key : le formulaire se remplit à nouveau à chaque brouillon */}
      <FormulaireAnnonce key={JSON.stringify(etat.brouillon ?? {})} action={action} libelle="Publier l'annonce" annulerVers="/annonces" initial={valeurs} />
    </div>
  );
}
