import Link from "next/link";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { CATEGORIES, CONTREPARTIES, TYPES } from "@/lib/annonces/validation";
import { dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";

export function CarteAnnonce({ annonce, index = 0 }: { annonce: Annonce; index?: number }) {

  return (
    <article
      className="apparition souleve relative flex flex-col gap-2.5 rounded-carte border border-ligne bg-surface p-4 hover:border-ligne-forte"
      style={{ "--i": index } as React.CSSProperties}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variante={annonce.type === "propose" ? "offre" : "besoin"}>{TYPES[annonce.type]}</Badge>
        <Badge>{CATEGORIES[annonce.categorie]}</Badge>
        {annonce.statut === "archivee" && <Badge>Archivée</Badge>}
        {annonce.statut === "masquee" && <Badge>Masquée par la modération</Badge>}
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
          <Avatar chemin={annonce.auteur?.avatar_chemin} nom={annonce.auteur?.pseudo ?? "?"} taille="sm" />
          @{annonce.auteur?.pseudo}
          {annonce.auteur?.ecole && <BadgeEcole ecole={annonce.auteur.ecole} />}
        </span>
        <span className="text-xs text-encre-douce">
          {CONTREPARTIES[annonce.contrepartie]} · {dateCourte(annonce.cree_le)}
        </span>
      </div>
    </article>
  );
}
