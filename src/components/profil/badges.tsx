import Link from "next/link";
import type { Badge } from "@/lib/gamification/progression";
import { Colette } from "@/components/colette/colette";

const FONDS = ["bg-bandeau", "bg-lilas", "bg-ciel", "bg-ocre"];
const PAPIERS = ["papier-jaune", "papier-lilas", "papier-ciel", "papier-ocre"];

// Les badges en pastilles. Survol : la pastille se soulève et dit où on en est. Clic : un post-it s'ouvre
// (popover natif, sans JavaScript) avec comment on l'a eu, ou comment le débloquer et où aller.
export function Badges({
  badges,
  prefixe,
  moi = false,
  grand = false,
}: {
  badges: Badge[];
  prefixe: string;
  moi?: boolean;
  grand?: boolean;
}) {
  const obtenus = badges.filter((b) => b.obtenu).length;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-encre-douce">
        {obtenus} sur {badges.length} débloqués
        {moi ? " · clique sur un badge pour savoir comment l'avoir" : ""}
      </p>
      <ul className="flex flex-wrap gap-2.5">
        {badges.map((b, i) => {
          const id = `${prefixe}-badge-${b.code}`;
          return (
            <li key={b.code} className="group relative">
              <button
                type="button"
                popoverTarget={id}
                className={`flex ${grand ? "size-16 text-[10px] sm:size-20 sm:text-[11px]" : "size-16 text-[10px]"} cursor-pointer items-center justify-center rounded-full p-1.5 text-center leading-tight font-bold transition-[translate,scale,box-shadow] duration-200 hover:-translate-y-1 hover:scale-110 focus-visible:-translate-y-1 focus-visible:scale-110 ${
                  b.obtenu
                    ? `${FONDS[i % 4]} shadow-[2px_2px_0_0_var(--color-encre)] hover:shadow-[4px_5px_0_0_var(--color-encre)]`
                    : "border-2 border-dashed border-ligne-forte bg-surface text-encre-douce hover:border-encre hover:text-encre"
                }`}
                style={{
                  rotate: b.obtenu ? `${(i % 3) * 6 - 6}deg` : undefined,
                }}
                aria-label={`${b.nom} : ${b.obtenu ? "débloqué" : `${b.actuel} sur ${b.objectif}`}`}
              >
                {b.nom}
              </button>
              {/* Au survol : où on en est */}
              <span className="pointer-events-none absolute top-full left-1/2 z-10 mt-1.5 hidden -translate-x-1/2 rounded-ui bg-encre px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-surface group-hover:block">
                {b.obtenu ? "Débloqué" : `${b.actuel} / ${b.objectif}`}
              </span>

              {/* Le popover reste un simple calque fixe ; le post-it est à l'intérieur (postit impose position: relative). */}
              <div
                id={id}
                popover="auto"
                className="m-auto w-[min(22rem,calc(100vw-2rem))] overflow-visible border-0 bg-transparent p-3 text-encre backdrop:bg-encre/30"
              >
                <div
                  className={`postit ${PAPIERS[i % 4]} pop flex flex-col gap-3 p-6 pt-8`}
                  style={
                    { "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties
                  }
                >
                  <span className="punaise" aria-hidden />
                  <div className="flex items-start gap-3">
                    <Colette
                      humeur={b.obtenu ? "fiere" : "concentree"}
                      anim={b.obtenu ? "saute" : "reflechit"}
                      accessoire={b.obtenu ? "etoile" : "aucun"}
                      saison={false}
                      taille={56}
                      className="shrink-0"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className="titre-charte text-xs">
                        {b.obtenu ? "Badge débloqué" : "Pas encore"}
                      </span>
                      <strong className="text-xl leading-tight">{b.nom}</strong>
                    </div>
                  </div>
                  <p className="text-sm leading-snug">
                    {b.obtenu
                      ? `${moi ? "Tu l'as eu" : "Obtenu"} : ${b.description.charAt(0).toLowerCase()}${b.description.slice(1)}.`
                      : b.comment}
                  </p>
                  <div className="flex flex-col gap-1">
                    <div
                      className="h-2 overflow-hidden rounded-full bg-surface/70"
                      role="progressbar"
                      aria-valuenow={b.actuel}
                      aria-valuemin={0}
                      aria-valuemax={b.objectif}
                    >
                      <div
                        className="h-full rounded-full bg-encre"
                        style={{
                          width: `${Math.round((b.actuel / b.objectif) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold">
                      {b.actuel} / {b.objectif}
                      {b.code === "bien_note" &&
                      !b.obtenu &&
                      b.actuel >= b.objectif
                        ? " · il manque la moyenne de 4,5"
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    {moi && !b.obtenu ? (
                      <Link
                        href={b.lien}
                        className="-rotate-2 font-main text-xl text-alerte underline-offset-4 hover:underline"
                      >
                        y aller
                      </Link>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      popoverTarget={id}
                      popoverTargetAction="hide"
                      className="text-sm font-semibold text-encre-douce hover:text-encre"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
