"use client";

import { useActionState } from "react";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { Champ } from "@/components/ui/champ";
import { BadgeIA } from "@/components/ia/badge-ia";
import { CATEGORIES, CONTREPARTIES, QUARTIERS, TRAMS, TYPES } from "@/lib/annonces/validation";
import { quartiersDu } from "@/lib/carte/mercator";
import type { EtatAnnonce } from "@/app/annonces/actions";

type Action = (etat: EtatAnnonce, formData: FormData) => Promise<EtatAnnonce>;

const CLASSE_SAISIE =
  "min-h-10 rounded-ui border border-ligne-forte bg-surface px-3 py-2 text-base font-normal outline-none focus:border-encre focus:ring-3 focus:ring-accent/20 aria-[invalid=true]:border-alerte";

function Erreur({ texte }: { texte?: string }) {
  return texte ? <span className="text-sm font-normal text-alerte">{texte}</span> : null;
}

export function FormulaireAnnonce({
  action,
  initial = {},
  libelle,
  annulerVers,
  campus = "Bordeaux",
}: {
  action: Action;
  initial?: Record<string, string>;
  libelle: string;
  annulerVers: string;
  campus?: string;
}) {
  const [etat, envoyer, enCours] = useActionState<EtatAnnonce, FormData>(action, {});
  const v = etat.valeurs ?? initial;
  const e = etat.erreurs ?? {};
  // Les quartiers de MON campus (et « Ailleurs ») ; on garde celui de l'annonce si elle vient d'ailleurs.
  const quartiers = [...new Set([...quartiersDu(campus), "hors_bordeaux", ...(v.quartier ? [v.quartier] : [])])].filter(
    (q) => q in QUARTIERS,
  ) as (keyof typeof QUARTIERS)[];
  const avecTram = campus === "Bordeaux";

  return (
    <form action={envoyer} className="flex flex-col gap-5" noValidate>
      <fieldset className="flex flex-col gap-1.5 text-sm font-semibold">
        <legend className="mb-1.5">Type d&apos;annonce</legend>
        <div className="flex flex-wrap gap-3">
          {Object.entries(TYPES).map(([valeur, label]) => (
            <label
              key={valeur}
              className="flex min-h-10 cursor-pointer items-center gap-2 rounded-ui border border-ligne-forte bg-surface px-4 py-2 font-normal has-[:checked]:border-encre has-[:checked]:bg-papier-fonce"
            >
              <input type="radio" name="type" value={valeur} defaultChecked={(v.type ?? "propose") === valeur} />
              {label}
            </label>
          ))}
        </div>
        <Erreur texte={e.type} />
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Catégorie
          <select name="categorie" defaultValue={v.categorie ?? ""} aria-invalid={!!e.categorie} className={CLASSE_SAISIE}>
            <option value="" disabled>
              Choisir une catégorie
            </option>
            {Object.entries(CATEGORIES).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
          <Erreur texte={e.categorie} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Contrepartie
          <select name="contrepartie" defaultValue={v.contrepartie ?? ""} aria-invalid={!!e.contrepartie} className={CLASSE_SAISIE}>
            <option value="" disabled>
              Choisir
            </option>
            {Object.entries(CONTREPARTIES).map(([valeur, label]) => (
              <option key={valeur} value={valeur}>
                {label}
              </option>
            ))}
          </select>
          <Erreur texte={e.contrepartie} />
        </label>
      </div>

      <Champ label="Titre" name="titre" erreur={e.titre} aide="Entre 5 et 80 caractères. Exemple : Photos pour vos événements d'asso" defaultValue={v.titre} />

      <label className="flex flex-col gap-1.5 text-sm font-semibold">
        Description
        <textarea
          name="description"
          rows={5}
          defaultValue={v.description}
          aria-invalid={!!e.description}
          className={`${CLASSE_SAISIE} resize-y`}
        />
        {e.description ? (
          <Erreur texte={e.description} />
        ) : (
          <span className="text-xs font-normal text-encre-douce">
            Ce que tu proposes ou cherches, quand, comment. Ne mets pas ton numéro : il s&apos;échange après accord.
          </span>
        )}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Quartier (facultatif)
          <select name="quartier" defaultValue={v.quartier ?? ""} aria-invalid={!!e.quartier} className={CLASSE_SAISIE}>
            <option value="">Pas précisé</option>
            {quartiers.map((valeur) => (
              <option key={valeur} value={valeur}>
                {QUARTIERS[valeur]}
              </option>
            ))}
          </select>
          <Erreur texte={e.quartier} />
        </label>
        {avecTram && (
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          Tram le plus proche (facultatif)
          <select name="tram" defaultValue={v.tram ?? ""} aria-invalid={!!e.tram} className={CLASSE_SAISIE}>
            <option value="">Pas précisé</option>
            {TRAMS.map((t) => (
              <option key={t} value={t}>
                Tram {t}
              </option>
            ))}
          </select>
          <Erreur texte={e.tram} />
        </label>
        )}
      </div>

      <Champ label="Précision sur le lieu (facultatif)" name="lieu" erreur={e.lieu} aide="Exemple : arrêt Porte de Bourgogne, studio photo du campus" defaultValue={v.lieu ?? ""} />

      {etat.message && (
        <p role="alert" className="text-sm text-alerte">
          {etat.message}
        </p>
      )}
      <p className="flex flex-wrap items-center gap-2 text-sm text-encre-douce">
        <BadgeIA numero={2} />
        Avant d&apos;être affiché, ton post-it est relu par Colette (arnaque, numéro laissé en clair). Si elle a un doute, elle te propose une correction.
      </p>
      <p className="text-sm text-encre-douce">
        À plusieurs ? Une fois publié, invite jusqu&apos;à 3 potes sur ton post-it depuis sa page : il devient un post-it de groupe.
      </p>
      <div className="flex flex-wrap gap-3">
        <Bouton disabled={enCours}>{enCours ? "Enregistrement..." : libelle}</Bouton>
        <BoutonLien href={annulerVers} variante="discret">
          Annuler
        </BoutonLien>
      </div>
    </form>
  );
}
