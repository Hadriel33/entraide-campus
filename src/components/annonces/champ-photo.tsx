"use client";

import { useState } from "react";
import { PHOTO_MAX, PHOTO_TYPES } from "@/lib/annonces/photo";

// La photo du post-it (facultative) : aperçu immédiat, remplacer ou retirer. Vérifiée aussi côté serveur.
export function ChampPhoto({ actuelle, erreur }: { actuelle?: string | null; erreur?: string }) {
  const [apercu, setApercu] = useState<string | null>(actuelle ?? null);
  const [retiree, setRetiree] = useState(false);
  const [alerte, setAlerte] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2 text-sm font-semibold">
      <span>Photo (facultatif)</span>
      <div className="flex flex-wrap items-center gap-4">
        {apercu && !retiree ? (
          // L'aperçu local (blob:) n'est pas une image distante : <img> simple, pas next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={apercu} alt="Aperçu de la photo" className="pop size-28 rounded-ui border border-ligne-forte object-cover" />
        ) : (
          <span className="flex size-28 items-center justify-center rounded-ui border-2 border-dashed border-ligne-forte text-center text-xs font-normal text-encre-douce">
            Un objet, une chambre, un shooting...
          </span>
        )}
        <div className="flex flex-col gap-2">
          <label className="presse inline-flex min-h-10 cursor-pointer items-center self-start rounded-ui border border-ligne-forte bg-surface px-4 py-2 hover:border-encre">
            {apercu && !retiree ? "Changer de photo" : "Ajouter une photo"}
            <input
              type="file"
              name="photo"
              accept={Object.keys(PHOTO_TYPES).join(",")}
              className="sr-only"
              onChange={(ev) => {
                const f = ev.currentTarget.files?.[0];
                if (!f) return;
                if (!(f.type in PHOTO_TYPES) || f.size > PHOTO_MAX) {
                  setAlerte("Photo en JPEG, PNG ou WebP, 2 Mo maximum.");
                  ev.currentTarget.value = "";
                  return;
                }
                setAlerte(null);
                setRetiree(false);
                setApercu(URL.createObjectURL(f));
              }}
            />
          </label>
          {actuelle && (
            <label className="flex items-center gap-2 font-normal">
              <input type="checkbox" name="retirer_photo" value="oui" checked={retiree} onChange={(ev) => setRetiree(ev.currentTarget.checked)} />
              Retirer la photo
            </label>
          )}
          <span className="text-xs font-normal text-encre-douce">JPEG, PNG ou WebP, 2 Mo maximum. Colette la relit avec ton texte.</span>
        </div>
      </div>
      {(alerte || erreur) && (
        <p role="alert" className="text-sm font-normal text-alerte">
          {alerte ?? erreur}
        </p>
      )}
    </div>
  );
}
