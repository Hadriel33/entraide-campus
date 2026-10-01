import { laisserAvis } from "@/app/demandes/actions";
import { Bouton } from "@/components/ui/bouton";
import { Etoile } from "@/components/ui/etoiles";

// Note en étoiles accessible : de vrais boutons radio, stylés. Fonctionne sans JavaScript.
// Les étoiles sont dans l'ordre 5..1 inversé à l'affichage, pour colorer « celle-ci et les précédentes » en CSS.
export function FormulaireAvis({ demandeId, retour, prenom }: { demandeId: string; retour: string; prenom: string }) {
  return (
    <form action={laisserAvis.bind(null, demandeId, retour)} className="flex flex-col gap-3 rounded-ui border border-ligne p-3">
      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Ton avis sur {prenom}</legend>
        <div className="flex flex-row-reverse justify-end gap-1">
          {[5, 4, 3, 2, 1].map((n) => (
            <label
              key={n}
              className="peer presse cursor-pointer text-ligne-forte hover:text-encre peer-hover:text-encre has-[:checked]:text-encre peer-has-[:checked]:text-encre"
            >
              <input type="radio" name="note" value={n} required className="sr-only" />
              <Etoile className="size-7" />
              <span className="sr-only">{n} sur 5</span>
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        name="commentaire"
        maxLength={300}
        rows={2}
        placeholder="Facultatif : comment ça s'est passé ?"
        className="rounded-ui border border-ligne-forte bg-surface px-3 py-2 text-sm outline-none focus:border-encre"
      />
      <Bouton className="self-start" variante="contour">
        Publier mon avis
      </Bouton>
    </form>
  );
}
