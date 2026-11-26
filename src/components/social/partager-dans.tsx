"use client";

import { SAISIE } from "@/components/ui/saisie";
import Link from "next/link";
import { useActionState, useState } from "react";
import { partagerPostit, type EtatPartage } from "@/app/fil/actions";
import { SALONS_THEMES, type Salon } from "@/lib/social/social";

// « Partager dans… » : envoyer ce post-it dans un salon (général, campus, classe, thème) ou une discussion,
// avec un petit mot. Il y apparaît en mini post-it cliquable.
export function PartagerDans({
  annonceId,
  salons,
  discussions,
  ouvertAuDepart = false,
}: {
  annonceId: string;
  salons: Salon[];
  discussions: { id: string; nom: string }[];
  /** Arrivé depuis le bouton « Partager » d'une carte du tableau : le panneau est déjà ouvert. */
  ouvertAuDepart?: boolean;
}) {
  const [ouvert, setOuvert] = useState(ouvertAuDepart);
  const [etat, partager, enCours] = useActionState<EtatPartage, FormData>(partagerPostit, {});
  const miens = salons.filter((s) => !s.id.startsWith("theme:"));

  if (!ouvert)
    return (
      <button
        type="button"
        onClick={() => setOuvert(true)}
        className="presse inline-flex min-h-10 items-center gap-2 rounded-ui border border-ligne-forte bg-surface px-3 text-sm font-semibold hover:border-encre"
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
        </svg>
        Partager dans…
      </button>
    );

  return (
    <form id="partager" action={partager} className="pop flex w-full basis-full scroll-mt-24 flex-col gap-3 rounded-carte border border-encre bg-surface p-4 shadow-[3px_3px_0_0_var(--color-bandeau)]">
      <input type="hidden" name="annonce" value={annonceId} />
      <div className="flex items-baseline justify-between gap-2">
        <strong className="titre-charte text-lg">Partager ce post-it</strong>
        <button type="button" onClick={() => setOuvert(false)} className="text-sm text-encre-douce hover:text-encre">
          Fermer
        </button>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Où ?
        <select name="destination" required defaultValue="" className={SAISIE}>
          <option value="" disabled>
            Choisir un salon ou une discussion
          </option>
          <optgroup label="Mes salons">
            {miens.map((s) => (
              <option key={s.id} value={`salon:${s.id}`}>
                {s.nom}
              </option>
            ))}
          </optgroup>
          <optgroup label="Salons par thème (tous les campus)">
            {SALONS_THEMES.map((s) => (
              <option key={s.id} value={`salon:${s.id}`}>
                {s.nom}
              </option>
            ))}
          </optgroup>
          {discussions.length > 0 && (
            <optgroup label="Mes discussions">
              {discussions.map((d) => (
                <option key={d.id} value={`discussion:${d.id}`}>
                  {d.nom}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Un petit mot (facultatif)
        <input name="mot" maxLength={300} autoComplete="off" placeholder="Ça te dit @lea ?" className="min-h-11 rounded-ui border border-ligne-forte bg-surface px-3 text-base font-normal" />
      </label>
      <button disabled={enCours} className="presse min-h-11 self-start rounded-ui bg-encre px-4 font-semibold text-surface hover:-translate-y-0.5 disabled:opacity-60">
        {enCours ? "Envoi..." : "Partager"}
      </button>
      {etat.message && (
        <p role="status" key={etat.message} className={`pop text-sm ${etat.ok ? "font-semibold text-ok" : "text-alerte"}`}>
          {etat.message}{" "}
          {etat.lien && (
            <Link href={etat.lien} className="underline">
              Ouvrir la discussion
            </Link>
          )}
        </p>
      )}
    </form>
  );
}
