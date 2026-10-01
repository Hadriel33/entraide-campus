import Link from "next/link";
import { etapesAccueil } from "@/lib/profils/accueil";

type Etat = Parameters<typeof etapesAccueil>[0];

// Accueil guidé : 4 étapes avec barre de progression. Disparaît quand tout est fait.
export function ChecklistAccueil({ etat, grand = false }: { etat: Etat; grand?: boolean }) {
  const { etapes, faites, termine } = etapesAccueil(etat);
  if (termine && !grand) return null;
  const pourcent = Math.round((faites / etapes.length) * 100);

  return (
    <section className="apparition flex flex-col gap-4 rounded-carte border border-encre bg-surface p-5" aria-labelledby="titre-accueil">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id="titre-accueil" className="titre-charte text-xl">
          {termine ? "Ton profil est prêt" : "Bien démarrer"}
        </h2>
        <span className="text-sm font-semibold">
          {faites} / {etapes.length}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-papier-fonce" role="progressbar" aria-valuenow={pourcent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-bandeau transition-[width] duration-700 ease-out" style={{ width: `${pourcent}%` }} />
      </div>
      <ol className={`grid gap-2 ${grand ? "" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        {etapes.map((e, i) => (
          <li key={e.code} className="apparition" style={{ "--i": i } as React.CSSProperties}>
            <Link
              href={e.lien}
              aria-disabled={e.fait}
              className={`souleve flex h-full items-start gap-3 rounded-ui border p-3 ${e.fait ? "border-ligne bg-ok-fond" : "border-ligne-forte bg-surface"}`}
            >
              <span
                className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${e.fait ? "bg-ok text-surface" : "bg-papier-fonce"}`}
                aria-hidden
              >
                {e.fait ? (
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 12 5 5L20 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </span>
              <span className="flex flex-col">
                <span className={`font-semibold ${e.fait ? "line-through decoration-1" : ""}`}>{e.titre}</span>
                <span className="text-xs text-encre-douce">{e.aide}</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
