"use client";

import { useActionState } from "react";
import { inviterMembre, type EtatInvitation } from "@/app/annonces/groupe-actions";
import { Bouton } from "@/components/ui/bouton";

export function FormulaireInvitation({ annonceId }: { annonceId: string }) {
  const [etat, inviter, enCours] = useActionState<EtatInvitation, FormData>(inviterMembre.bind(null, annonceId), {});
  return (
    <form action={inviter} className="flex flex-col gap-2">
      <label htmlFor={`invite-${annonceId}`} className="text-sm font-semibold">
        Inviter un pote sur ce post-it
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          id={`invite-${annonceId}`}
          key={etat.ok ? etat.message : undefined}
          name="pseudo"
          placeholder="@pseudo"
          autoComplete="off"
          className="min-h-11 min-w-48 flex-1 rounded-ui border border-ligne-forte bg-surface px-3 text-base outline-none focus:border-encre"
        />
        <Bouton disabled={enCours}>{enCours ? "Envoi..." : "Inviter"}</Bouton>
      </div>
      {etat.message && (
        <p role="status" key={etat.message} className={`pop text-sm ${etat.ok ? "font-semibold text-ok" : "text-alerte"}`}>
          {etat.message}
        </p>
      )}
    </form>
  );
}
