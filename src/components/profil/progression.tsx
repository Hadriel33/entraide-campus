import {
  calculerProgression,
  type Stats,
} from "@/lib/gamification/progression";
import { Badges } from "./badges";
import { SEUIL_TITRE, TITRES, titresObtenus } from "@/lib/gamification/titres";

// Niveau, points, barre de progression et badges. Les chiffres viennent de stats_profil (base), le calcul de progression.ts.
export function CarteProgression({
  stats,
  moi = false,
}: {
  stats: Stats;
  moi?: boolean;
}) {
  const p = calculerProgression(stats);
  const titres = titresObtenus(stats.aides_par_categorie ?? {});
  return (
    <section
      className="flex flex-col gap-4 rounded-carte border border-ligne bg-surface p-5"
      aria-label="Progression"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-encre-douce">Niveau</p>
          <p className="titre-charte pop text-3xl">{p.niveau.nom}</p>
        </div>
        <p className="text-right">
          <span className="titre-charte text-3xl">{p.points}</span>
          <span className="block text-sm text-encre-douce">points</span>
        </p>
      </div>
      <div>
        <div
          className="h-2.5 overflow-hidden rounded-full bg-papier-fonce"
          role="progressbar"
          aria-valuenow={p.progression}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-bandeau transition-[width] duration-700 ease-out"
            style={{ width: `${p.progression}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-encre-douce">
          {p.suivant
            ? `Encore ${p.suivant.min - p.points} points avant « ${p.suivant.nom} »`
            : "Niveau maximum atteint. Respect."}
        </p>
      </div>
      {titres.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-encre-douce">Titres :</span>
          {titres.map((t) => (
            <span
              key={t.categorie}
              className="pop rounded-ui bg-encre px-2.5 py-1 text-xs font-semibold text-surface"
            >
              {t.titre}
            </span>
          ))}
        </div>
      ) : (
        moi && (
          <p className="text-xs text-encre-douce">
            Titres de spécialité : aide {SEUIL_TITRE} personnes différentes dans
            une catégorie pour devenir par exemple « {TITRES.photo} ».
          </p>
        )
      )}
      <Badges
        badges={p.badges}
        prefixe={moi ? "moi" : "profil"}
        moi={moi}
        grand
      />
      {moi && (
        <p className="text-xs text-encre-douce">
          Aider rapporte 30 points par personne aidée, recevoir de l&apos;aide
          10, un avis reçu 5, une entraide ESD × ESP 10 de plus, un défi de la
          semaine 20. Les points se calculent tout seuls : personne ne peut les
          modifier.
        </p>
      )}
    </section>
  );
}
