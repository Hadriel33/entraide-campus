import Link from "next/link";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { CATEGORIES, CONTREPARTIES, QUARTIERS, TYPES } from "@/lib/annonces/validation";
import { joursRestants } from "@/lib/annonces/expiration";
import { dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";

export function CarteAnnonce({ annonce, index = 0, afficherExpiration = false }: { annonce: Annonce; index?: number; afficherExpiration?: boolean }) {
  const jours = joursRestants(annonce.expire_le);

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
        {afficherExpiration && annonce.statut === "publiee" && (
          <Badge variante={jours <= 3 ? "besoin" : "neutre"}>{jours === 0 ? "Expirée" : `Expire dans ${jours} j`}</Badge>
        )}
      </div>
      <h3 className="text-base leading-snug font-semibold">
        {/* Le lien couvre toute la carte (pseudo-élément), le texte reste sélectionnable. */}
        <Link href={`/annonces/${annonce.id}`} className="after:absolute after:inset-0 after:content-['']">
          {annonce.titre}
        </Link>
      </h3>
      <p className="line-clamp-2 text-sm text-encre-douce">{annonce.description}</p>
      {(annonce.quartier || annonce.tram) && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
          {annonce.tram && <span className="rounded-ui bg-encre px-1.5 py-0.5 text-surface">Tram {annonce.tram}</span>}
          {annonce.quartier && <span className="text-encre-douce">{QUARTIERS[annonce.quartier]}</span>}
        </p>
      )}
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
