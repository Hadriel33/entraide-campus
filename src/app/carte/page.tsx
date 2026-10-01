import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { QUARTIERS, TRAMS } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Carte" };

type Quartier = keyof typeof QUARTIERS;
type Mini = { id: string; titre: string; categorie: string; quartier: Quartier | null };

// Plan schématique de Bordeaux (pas une carte exacte) : positions en % d'un cadre 900 × 620.
const POSITION: Record<Exclude<Quartier, "hors_bordeaux">, [number, number]> = {
  bacalan: [47, 9],
  chartrons: [49, 24],
  centre: [53, 43],
  victor_hugo: [44, 54],
  saint_michel: [57, 59],
  saint_jean: [60, 73],
  bastide: [73, 39],
  cauderan: [30, 35],
  merignac: [11, 47],
  talence_pessac: [31, 81],
  begles: [63, 90],
};

const LIGNES: { tram: string; trace: string; couleur: string }[] = [
  { tram: "A", trace: "M40 300 L280 292 L470 270 L655 250 L870 232", couleur: "var(--color-tram-a)" },
  { tram: "B", trace: "M420 30 L445 150 L475 268 L400 335 L330 430 L280 505 L210 600", couleur: "var(--color-tram-b)" },
  { tram: "C", trace: "M490 30 L495 180 L482 268 L515 365 L540 452 L568 560 L585 615", couleur: "var(--color-tram-c)" },
  { tram: "D", trace: "M150 120 L270 215 L390 250 L470 270", couleur: "var(--color-tram-d)" },
];

const CLASSE_TRAM: Record<string, string> = { A: "bg-tram-a", B: "bg-tram-b", C: "bg-tram-c", D: "bg-tram-d" };

export default async function PageCarte() {
  const { supabase } = await exigerSession();
  const { data } = await supabase
    .from("annonces")
    .select("id, titre, categorie, quartier")
    .eq("statut", "publiee")
    .gt("expire_le", new Date().toISOString())
    .order("cree_le", { ascending: false })
    .limit(300);
  const annonces = (data ?? []) as Mini[];
  const parQuartier = annonces.reduce<Record<string, Mini[]>>((acc, a) => {
    if (a.quartier) (acc[a.quartier] ??= []).push(a);
    return acc;
  }, {});
  const sansLieu = annonces.filter((a) => !a.quartier).length;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Les post-it punaisés là où ça se passe. Clique sur un quartier pour voir ses annonces.">La carte</TitrePage>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold" aria-label="Lignes de tram">
          {TRAMS.map((t) => (
            <Link key={t} href={`/annonces?tram=${t}`} className={`presse rounded-ui px-2.5 py-1 text-surface ${CLASSE_TRAM[t]}`}>
              Tram {t}
            </Link>
          ))}
        </nav>
      </div>

      <div className="relative hidden aspect-[900/620] w-full overflow-hidden rounded-carte border border-ligne bg-papier-fonce sm:block">
        <svg viewBox="0 0 900 620" className="absolute inset-0 size-full" aria-hidden>
          {/* La Garonne */}
          <path d="M520 -10 C560 120 585 200 600 280 C615 380 640 470 660 630" fill="none" stroke="var(--color-ciel)" strokeWidth="54" strokeLinecap="round" />
          {LIGNES.map((l) => (
            <path key={l.tram} d={l.trace} fill="none" stroke={l.couleur} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>
        <span className="absolute top-[52%] left-[67%] -rotate-[72deg] font-main text-2xl text-encre-bleue" aria-hidden>
          la Garonne
        </span>

        {(Object.keys(POSITION) as (keyof typeof POSITION)[]).map((q, i) => {
          const liste = parQuartier[q] ?? [];
          const [x, y] = POSITION[q];
          const premiere = liste[0];
          return (
            <Link
              key={q}
              href={`/annonces?quartier=${q}`}
              className={`colle postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} absolute flex w-36 -translate-x-1/2 -translate-y-1/2 flex-col gap-0.5 p-2.5 pt-4 text-left lg:w-40 ${liste.length ? "" : "opacity-70"}`}
              style={{ left: `${x}%`, top: `${y}%`, "--i": i, "--rot": `${(i % 3) * 2 - 2}deg` } as React.CSSProperties}
            >
              <span className="punaise" aria-hidden />
              <span className="flex items-baseline justify-between gap-1">
                <strong className="truncate text-xs">{QUARTIERS[q]}</strong>
                <span className="titre-charte text-lg">{liste.length}</span>
              </span>
              {premiere ? <span className="line-clamp-2 text-[11px] leading-tight text-encre/75">{premiere.titre}</span> : <span className="font-main text-sm text-encre-douce">rien encore</span>}
            </Link>
          );
        })}

        <div className="absolute right-4 bottom-4 flex items-end gap-2">
          <Colette anim="cherche" taille={70} />
          {(parQuartier.hors_bordeaux?.length ?? 0) + sansLieu > 0 && (
            <Link href="/annonces?quartier=hors_bordeaux" className="postit papier-gris p-2.5 pt-4 text-xs" style={{ "--rot": "2deg" } as React.CSSProperties}>
              <span className="punaise" aria-hidden />
              Hors Bordeaux ou sans lieu : <strong>{(parQuartier.hors_bordeaux?.length ?? 0) + sansLieu}</strong>
            </Link>
          )}
        </div>
      </div>

      {/* Liste par quartier : sur téléphone, et pour les lecteurs d'écran */}
      <section className="flex flex-col gap-3" aria-label="Annonces par quartier">
        <h2 className="titre-charte text-section sm:sr-only">Par quartier</h2>
        <ul className="grid gap-2 sm:hidden">
          {(Object.keys(QUARTIERS) as Quartier[]).map((q) => (
            <li key={q}>
              <Link href={`/annonces?quartier=${q}`} className="flex items-center justify-between rounded-ui border border-ligne bg-surface px-4 py-3 font-medium">
                {QUARTIERS[q]}
                <span className="titre-charte text-xl">{parQuartier[q]?.length ?? 0}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <p className="text-xs text-encre-douce">Plan schématique : les positions des quartiers et des lignes sont simplifiées.</p>
    </div>
  );
}
