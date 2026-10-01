import { calculerProgression, type Stats } from "@/lib/gamification/progression";

// Niveau, points, barre de progression et badges. Les chiffres viennent de stats_profil (base), le calcul de progression.ts.
export function CarteProgression({ stats, moi = false }: { stats: Stats; moi?: boolean }) {
  const p = calculerProgression(stats);
  return (
    <section className="flex flex-col gap-4 rounded-carte border border-ligne bg-surface p-5" aria-label="Progression">
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
        <div className="h-2.5 overflow-hidden rounded-full bg-papier-fonce" role="progressbar" aria-valuenow={p.progression} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-bandeau transition-[width] duration-700 ease-out" style={{ width: `${p.progression}%` }} />
        </div>
        <p className="mt-1.5 text-xs text-encre-douce">
          {p.suivant ? `Encore ${p.suivant.min - p.points} points avant « ${p.suivant.nom} »` : "Niveau maximum atteint. Respect."}
        </p>
      </div>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {p.badges.map((b, i) => (
          <li
            key={b.code}
            className={`apparition flex flex-col gap-0.5 rounded-ui border p-2.5 text-sm ${b.obtenu ? "border-encre bg-offre" : "border-dashed border-ligne-forte text-encre-douce"}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <span className="font-semibold">{b.nom}</span>
            <span className="text-xs">{b.obtenu ? "Obtenu" : b.description}</span>
          </li>
        ))}
      </ul>
      {moi && (
        <p className="text-xs text-encre-douce">
          Aider rapporte 30 points par personne aidée, recevoir de l&apos;aide 10, un avis reçu 5, une entraide ESD × ESP 10 de plus. Les
          points se calculent tout seuls : personne ne peut les modifier.
        </p>
      )}
    </section>
  );
}
