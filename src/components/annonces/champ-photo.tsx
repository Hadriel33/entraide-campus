"use client";

import { useState } from "react";
import { PHOTO_MAX, PHOTO_TYPES, dimensionsReduites } from "@/lib/annonces/photo";

// Réduit la photo dans le navigateur (1600 px, JPEG) : les photos de téléphone (3 à 6 Mo) passent sous 2 Mo.
// Si le navigateur ne sait pas lire l'image (HEIC sur certains ordinateurs), on renvoie null.
async function reduire(f: File): Promise<File | null> {
  try {
    const image = await createImageBitmap(f);
    const { largeur, hauteur } = dimensionsReduites(image.width, image.height);
    const toile = document.createElement("canvas");
    toile.width = largeur;
    toile.height = hauteur;
    toile.getContext("2d")?.drawImage(image, 0, 0, largeur, hauteur);
    const blob = await new Promise<Blob | null>((ok) => toile.toBlob(ok, "image/jpeg", 0.85));
    return blob ? new File([blob], "photo.jpg", { type: "image/jpeg" }) : null;
  } catch {
    return null;
  }
}

// La photo du post-it (facultative) : aperçu immédiat, remplacer ou retirer. Vérifiée aussi côté serveur.
export function ChampPhoto({ actuelle, erreur }: { actuelle?: string | null; erreur?: string }) {
  const [apercu, setApercu] = useState<string | null>(actuelle ?? null);
  const [retiree, setRetiree] = useState(false);
  const [alerte, setAlerte] = useState<string | null>(null);
  const [prepare, setPrepare] = useState(false);

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
            {prepare ? "Préparation..." : apercu && !retiree ? "Changer de photo" : "Ajouter une photo"}
            <input
              type="file"
              name="photo"
              accept={[...Object.keys(PHOTO_TYPES), "image/heic", "image/heif"].join(",")}
              className="sr-only"
              onChange={async (ev) => {
                const champ = ev.currentTarget;
                const f = champ.files?.[0];
                if (!f) return;
                setAlerte(null);
                setPrepare(true);
                // Déjà légère et au bon format : on l'envoie telle quelle ; sinon on la réduit.
                const prete = f.type in PHOTO_TYPES && f.size <= PHOTO_MAX / 2 ? f : await reduire(f);
                setPrepare(false);
                if (!prete || prete.size > PHOTO_MAX) {
                  setAlerte("Cette photo n'a pas pu être lue. Choisis une photo JPEG ou PNG (sur iPhone : Réglages, Appareil photo, Formats, « Le plus compatible »).");
                  champ.value = "";
                  return;
                }
                const lot = new DataTransfer();
                lot.items.add(prete);
                champ.files = lot.files;
                setRetiree(false);
                setApercu(URL.createObjectURL(prete));
              }}
            />
          </label>
          {actuelle && (
            <label className="flex items-center gap-2 font-normal">
              <input type="checkbox" name="retirer_photo" value="oui" checked={retiree} onChange={(ev) => setRetiree(ev.currentTarget.checked)} />
              Retirer la photo
            </label>
          )}
          <span className="text-xs font-normal text-encre-douce">Une photo de ton téléphone, réduite automatiquement. Colette la relit avec ton texte.</span>
        </div>
      </div>
      {(alerte || erreur) && (
        <p role="alert" className="pop rounded-ui border border-alerte bg-surface px-3 py-2 text-sm font-semibold text-alerte">
          {alerte ?? erreur}
        </p>
      )}
    </div>
  );
}
