import Link from "next/link";
import { texteSerie } from "@/lib/social/revenir";

// La série de semaines : la raison de repasser chaque semaine. Publier, commenter, réagir, écrire dans un salon
// ou s'entraider suffit (calculé en base, migration 0027). Les paliers donnent des pièces pour Colette.
export function CarteSerie({ serie }: { serie: number }) {
  const prochain = serie < 2 ? "À 2 semaines : le motif Étoilé pour ta Colette." : serie < 3 ? "À 3 semaines : la Flamme pour ta Colette." : "Flamme et motif Étoilé gagnés. Garde le rythme !";
  return (
    <section className="flex items-start gap-4 rounded-carte border border-encre bg-surface p-5 shadow-[3px_3px_0_0_var(--color-accent)]">
      <span className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-full ${serie > 0 ? "bg-accent text-surface" : "bg-papier-fonce text-encre-douce"}`}>
        <svg viewBox="0 0 24 24" className="size-5 overflow-visible" fill="currentColor" aria-hidden>
          <path className={serie > 0 ? "flamme-danse" : undefined} d="M12 2c3 3.5 5 6.5 5 10a5 5 0 0 1-10 0c0-1.8.7-3.4 2-4.6.2 1.6 1 2.6 2 3 0-3.4.4-5.8 1-8.4z" />
        </svg>
        <span className="text-sm leading-none font-bold">{serie}</span>
      </span>
      <div className="flex flex-col gap-1">
        <h2 className="titre-charte text-xl">Ma série</h2>
        <p className="font-semibold">{texteSerie(serie)}</p>
        <p className="text-sm leading-snug text-encre-douce">
          Chaque semaine compte si tu publies, commentes, réagis ou aides quelqu&apos;un. {prochain}
        </p>
        <Link href="/fil" className="mt-1 self-start text-sm font-semibold text-encre underline">
          Passer sur le fil
        </Link>
      </div>
    </section>
  );
}
