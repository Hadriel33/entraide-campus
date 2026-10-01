import Link from "next/link";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { CATEGORIES, CONTREPARTIES, TYPES } from "@/lib/annonces/validation";
import { dateCourte, type Annonce } from "@/lib/annonces/requetes";

export function CarteAnnonce({ annonce }: { annonce: Annonce }) {
  const initiales = (annonce.auteur?.prenom ?? "?").slice(0, 2).toUpperCase();

  return (
    <article className="relative flex flex-col gap-2.5 rounded-carte border border-ligne bg-surface p-4 transition-colors hover:border-ligne-forte">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variante={annonce.type === "propose" ? "offre" : "besoin"}>{TYPES[annonce.type]}</Badge>
        <Badge>{CATEGORIES[annonce.categorie]}</Badge>
        {annonce.statut === "archivee" && <Badge>Archivée</Badge>}
      </div>
      <h3 className="text-base leading-snug font-semibold">
        {/* Le lien couvre toute la carte (pseudo-élément), le texte reste sélectionnable. */}
        <Link href={`/annonces/${annonce.id}`} className="after:absolute after:inset-0 after:content-['']">
          {annonce.titre}
        </Link>
      </h3>
      <p className="line-clamp-2 text-sm text-encre-douce">{annonce.description}</p>
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-ligne pt-2.5 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <span className="flex size-6 items-center justify-center rounded-full bg-papier-fonce text-[11px] font-semibold" aria-hidden>
            {initiales}
          </span>
          {annonce.auteur?.prenom}
          {annonce.auteur?.ecole && <BadgeEcole ecole={annonce.auteur.ecole} />}
        </span>
        <span className="text-xs text-encre-douce">
          {CONTREPARTIES[annonce.contrepartie]} · {dateCourte(annonce.cree_le)}
        </span>
      </div>
    </article>
  );
}
