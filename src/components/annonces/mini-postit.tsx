import Image from "next/image";
import Link from "next/link";
import { CATEGORIES, TYPES, type Categorie, type TypeAnnonce } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import { urlPhotoAnnonce } from "@/lib/annonces/photo";
import { PictoCategorie } from "./picto-categorie";

export type MiniAnnonce = { id: string; titre: string; categorie: Categorie; type: TypeAnnonce; photo_chemin?: string | null };

// Un post-it partagé dans un salon ou une discussion (0033) : petit, cliquable. Masqué ou supprimé entre-temps,
// la base ne le renvoie plus : on l'annonce simplement indisponible.
export function MiniPostit({ annonce }: { annonce: MiniAnnonce | null }) {
  if (!annonce)
    return <span className="block rounded-ui border border-dashed border-ligne-forte px-3 py-2 text-xs text-encre-douce">Post-it indisponible</span>;
  const photo = urlPhotoAnnonce(annonce.photo_chemin);
  return (
    <Link
      href={`/annonces/${annonce.id}`}
      className={`postit ${teinte(annonce.categorie).papier} flex w-full max-w-64 items-center gap-2.5 p-2.5 text-encre hover:no-underline`}
      style={{ "--rot": "-1deg" } as React.CSSProperties}
    >
      {photo ? (
        <span className="relative size-12 shrink-0 overflow-hidden rounded-[3px]">
          <Image src={photo} alt="" fill sizes="48px" className="object-cover" />
        </span>
      ) : (
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${teinte(annonce.categorie).point} ring-2 ring-encre`}>
          <PictoCategorie categorie={annonce.categorie} className="size-5" />
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="text-[10px] font-bold tracking-wide uppercase">
          {TYPES[annonce.type]} · {CATEGORIES[annonce.categorie]}
        </span>
        <span className="line-clamp-2 text-sm leading-tight font-semibold">{annonce.titre}</span>
      </span>
    </Link>
  );
}

export const SELECT_MINI = "annonce_id, annonce:annonces(id, titre, categorie, type, photo_chemin)";
