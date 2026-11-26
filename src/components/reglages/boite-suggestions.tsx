"use client";

import { useActionState } from "react";
import { Bouton } from "@/components/ui/bouton";
import { SAISIE } from "@/components/ui/saisie";
import { CATEGORIES_SUGGESTION, TEXTE_MAX } from "@/lib/suggestions/validation";
import { envoyerSuggestion, type EtatSuggestion } from "@/app/reglages/actions";

const PUCE =
  "presse cursor-pointer rounded-full border border-ligne-forte bg-surface px-3 py-1.5 text-sm font-semibold has-[:checked]:border-encre has-[:checked]:bg-encre has-[:checked]:text-surface";

// La boîte à suggestions : une sorte de retour (idée, bug, autre) et un texte libre, envoyés à l'équipe.
export function BoiteSuggestions() {
  const [etat, action] = useActionState<EtatSuggestion, FormData>(envoyerSuggestion, {});
  return (
    <form action={action} className="flex flex-col gap-3" key={etat.ok ? "envoyee" : "saisie"}>
      <fieldset className="flex flex-wrap gap-1.5">
        <legend className="sr-only">C&apos;est plutôt</legend>
        {Object.entries(CATEGORIES_SUGGESTION).map(([v, l], i) => (
          <label key={v} className={PUCE}>
            <input type="radio" name="categorie" value={v} defaultChecked={i === 0} className="sr-only" />
            {l}
          </label>
        ))}
      </fieldset>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Ton message
        <textarea
          name="texte"
          required
          minLength={10}
          maxLength={TEXTE_MAX}
          rows={4}
          defaultValue={etat.texte ?? ""}
          placeholder="Ce qui te manque, ce qui bloque, ce qui te ferait revenir..."
          className={`${SAISIE} resize-y`}
        />
      </label>
      {etat.erreur && (
        <p role="alert" className="text-sm text-alerte">
          {etat.erreur}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Bouton>Envoyer à l&apos;équipe</Bouton>
        {etat.ok && (
          <p role="status" className="pop text-sm font-semibold">
            Merci ! Colette l&apos;a punaisé sur le tableau de l&apos;équipe.
          </p>
        )}
      </div>
    </form>
  );
}
