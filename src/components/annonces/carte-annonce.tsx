import Link from "next/link";
import { ViewTransition } from "react";
import {
  CATEGORIES,
  QUARTIERS,
  TYPES,
  type Contrepartie,
} from "@/lib/annonces/validation";
import { joursRestants } from "@/lib/annonces/expiration";
import { dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { inclinaison, teinte } from "@/lib/design/teintes";
import { forme } from "@/lib/design/formes";

// Version courte de la contrepartie, écrite au feutre sur le post-it.
const ANNOTATION: Record<Contrepartie, string> = {
  gratuit: "Gratuit !",
  troc: "Troc",
  partage_frais: "Frais partagés",
  remunere: "Rémunéré",
  a_discuter: "À discuter",
};

// Une annonce = un post-it sur le tableau du campus. Couleur = famille de la catégorie, forme = type d'annonce
// (billet pour un covoit, petite annonce à languettes pour une coloc...), légère inclinaison propre à chaque
// annonce, annotation écrite à la main. Le texte garde la même disposition dans toutes les formes.
export function CarteAnnonce({
  annonce,
  index = 0,
  afficherExpiration = false,
  match,
}: {
  annonce: Annonce;
  index?: number;
  afficherExpiration?: boolean;
  match?: { niveau: string; raisons: string[] };
}) {
  const jours = joursRestants(annonce.expire_le);
  const t = teinte(annonce.categorie);
  const cherche = annonce.type === "cherche";
  const f = forme(annonce.categorie);

  const entete = (
    <div className="flex items-center justify-between gap-2">
      <span
        className={`titre-charte shrink-0 rounded-[3px] px-1.5 pt-0.5 text-sm whitespace-nowrap ${cherche ? "bg-encre text-surface" : "border-[1.5px] border-encre"}`}
      >
        {TYPES[annonce.type]}
      </span>
      <span className="flex min-w-0 items-center gap-1.5 text-right text-xs font-semibold">
        <span
          className={`size-2 shrink-0 rounded-full ${t.point} ring-1 ring-encre/20`}
          aria-hidden
        />
        {CATEGORIES[annonce.categorie]}
      </span>
    </div>
  );
  const titre = (
    <h3 className="text-lg leading-tight font-bold text-balance">
      {/* Le lien couvre tout le post-it (pseudo-élément), le texte reste sélectionnable. */}
      <Link
        href={`/annonces/${annonce.id}`}
        className="decoration-2 underline-offset-4 group-hover:underline after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
      >
        {/* Le titre « glisse » du post-it vers la page de l'annonce (View Transitions). */}
        <ViewTransition
          name={`titre-${annonce.id}`}
          share="morph"
          default="none"
        >
          <span>{annonce.titre}</span>
        </ViewTransition>
      </Link>
    </h3>
  );

  return (
    <article
      className={`group colle postit ${t.papier} forme-${f} flex min-h-56 flex-col gap-3 p-5 ${f === "etiquette" ? "pt-11" : "pt-6"}`}
      style={
        {
          "--i": index,
          "--rot": `${inclinaison(annonce.id)}deg`,
        } as React.CSSProperties
      }
    >
      {f === "etiquette" ? (
        <span className="oeillet" aria-hidden />
      ) : (
        f !== "billet" && <span className="scotch" aria-hidden />
      )}
      {f === "polaroid" ? (
        // Polaroid : le type, la catégorie et le titre dans la « photo », le reste sur le cadre blanc.
        <div className={`polaroid-photo ${t.papier} bg-(--postit)`}>
          {entete}
          {titre}
        </div>
      ) : f === "billet" ? (
        // Billet : l'en-tête au-dessus de la ligne pointillée, comme le talon d'un ticket.
        <div className="billet-tete flex flex-col gap-1">
          <span className="font-main text-sm leading-none text-encre/60">billet de trajet</span>
          {entete}
        </div>
      ) : (
        entete
      )}

      {/* Tri « Pour moi » : pourquoi ce post-it te correspond (compétences du CV, catégories). */}
      {match && (
        <p className="-mt-1 flex flex-col gap-0.5 self-start rounded-ui bg-surface/80 px-2.5 py-1.5 text-xs leading-snug">
          <strong className="titre-charte text-sm text-alerte">
            {match.niveau}
          </strong>
          {match.raisons.map((r) => (
            <span key={r}>{r}</span>
          ))}
        </p>
      )}

      {f !== "polaroid" && titre}
      <p className="line-clamp-3 text-[0.9375rem] leading-relaxed text-encre/75">
        {annonce.description}
      </p>

      {(annonce.quartier ||
        annonce.tram ||
        (afficherExpiration && annonce.statut === "publiee") ||
        annonce.statut !== "publiee") && (
        <p className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          {annonce.tram && (
            <span className="rounded-[3px] bg-encre px-1.5 py-0.5 text-surface">
              Tram {annonce.tram}
            </span>
          )}
          {annonce.quartier && (
            <span className="text-encre/70">{QUARTIERS[annonce.quartier]}</span>
          )}
          {annonce.statut === "archivee" && (
            <span className="rounded-[3px] bg-surface/70 px-1.5 py-0.5">
              Archivée
            </span>
          )}
          {annonce.statut === "masquee" && (
            <span className="rounded-[3px] bg-surface/70 px-1.5 py-0.5">
              Masquée par la modération
            </span>
          )}
          {afficherExpiration && annonce.statut === "publiee" && (
            <span
              className={`rounded-[3px] px-1.5 py-0.5 ${jours <= 3 ? "bg-accent text-surface" : "bg-surface/70"}`}
            >
              {jours === 0 ? "Expirée" : `Expire dans ${jours} j`}
            </span>
          )}
        </p>
      )}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
        <span className="flex min-w-[7rem] flex-1 items-center gap-2 text-sm font-semibold">
          <Avatar
            chemin={annonce.auteur?.avatar_chemin}
            nom={annonce.auteur?.pseudo ?? "?"}
            taille="sm"
            colette={annonce.auteur}
          />
          <span className="truncate">@{annonce.auteur?.pseudo}</span>
        </span>
        <span className="flex shrink-0 flex-col items-end leading-none">
          {/* Annotation au feutre : la contrepartie, comme griffonnée sur le post-it. */}
          <span className="-rotate-3 font-main text-xl font-bold text-alerte">
            {ANNOTATION[annonce.contrepartie]}
          </span>
          <span className="mt-1 text-[11px] text-encre/60">
            {dateCourte(annonce.cree_le)}
          </span>
        </span>
      </div>
      {f === "languettes" && (
        // Les languettes « contact » de la petite annonce de laverie. Elles ne donnent jamais de numéro :
        // les coordonnées passent toujours par « Demander le contact » (règle d'or n°1).
        <div className="languettes" aria-hidden>
          {["contact", "contact", "contact", "contact", "contact", "contact"].map((l, i) => (
            <span key={i} className={i === 2 ? "arrachee" : undefined}>
              {l}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
