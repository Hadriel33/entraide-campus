import Link from "next/link";
import { CATEGORIES, CONTREPARTIES, TYPES } from "@/lib/annonces/validation";
import { dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { teinte } from "@/lib/design/teintes";

// Vue liste : une annonce par ligne, bien droite, pour lire vite.
export function LigneAnnonce({ annonce }: { annonce: Annonce }) {
  const t = teinte(annonce.categorie);
  return (
    <li>
      <Link
        href={`/annonces/${annonce.id}`}
        className={`group flex flex-wrap items-center gap-x-4 gap-y-1 border-l-[6px] bg-surface px-4 py-3 hover:bg-papier-fonce ${t.bordure}`}
      >
        <span className={`titre-charte w-24 shrink-0 text-sm ${annonce.type === "cherche" ? "text-encre" : "text-encre-douce"}`}>{TYPES[annonce.type]}</span>
        <span className="min-w-0 flex-1 font-semibold group-hover:underline">{annonce.titre}</span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-encre-douce">
          <span className={`size-2 rounded-full ${t.point}`} aria-hidden />
          {CATEGORIES[annonce.categorie]}
        </span>
        <span className="w-32 text-xs text-encre-douce">{CONTREPARTIES[annonce.contrepartie]}</span>
        <span className="w-36 truncate text-xs">
          @{annonce.auteur?.pseudo} · {annonce.auteur?.ecole}
        </span>
        <span className="w-14 text-right text-xs text-encre-douce">{dateCourte(annonce.cree_le)}</span>
      </Link>
    </li>
  );
}
