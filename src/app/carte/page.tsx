import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { QUARTIERS, TRAMS } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import { CADRE_BORDEAUX, GPS_QUARTIERS, ratio, tuiles, versPourcent } from "@/lib/carte/mercator";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Carte" };

type Quartier = keyof typeof QUARTIERS;
type Mini = { id: string; titre: string; categorie: string; quartier: Quartier | null };

const CLASSE_TRAM: Record<string, string> = { A: "bg-tram-a", B: "bg-tram-b", C: "bg-tram-c", D: "bg-tram-d" };

// La vraie carte de Bordeaux et de ses environs : tuiles OpenStreetMap posées à la main (sans librairie),
// un post-it punaisé à la position GPS de chaque quartier. Fond adouci, ou inversé en mode tableau noir.
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
  const ailleurs = (parQuartier.hors_bordeaux?.length ?? 0) + annonces.filter((a) => !a.quartier).length;
  const quartiers = Object.keys(GPS_QUARTIERS) as (keyof typeof GPS_QUARTIERS)[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Bordeaux et ses environs : chaque punaise est un quartier. Clique pour voir ses annonces.">La carte</TitrePage>
        <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold" aria-label="Lignes de tram">
          {TRAMS.map((t) => (
            <Link key={t} href={`/annonces?tram=${t}`} className={`presse rounded-ui px-2.5 py-1 text-surface ${CLASSE_TRAM[t]}`}>
              Tram {t}
            </Link>
          ))}
        </nav>
      </div>

      <figure className="flex flex-col gap-2">
        <div className="relative w-full overflow-hidden rounded-carte border border-ligne bg-papier-fonce" style={{ aspectRatio: ratio() }}>
          {/* Fond de carte OpenStreetMap, adouci par un filtre (inversé en mode tableau noir, voir globals.css). */}
          <div className="fond-carte absolute inset-0" aria-hidden>
            {tuiles().map((t) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${t.x}-${t.y}`}
                src={`https://tile.openstreetmap.org/${CADRE_BORDEAUX.zoom}/${t.x}/${t.y}.png`}
                alt=""
                draggable={false}
                className="absolute max-w-none select-none"
                style={{ left: `${t.gauche}%`, top: `${t.haut}%`, width: `${t.largeur + 0.05}%`, height: `${t.hauteur + 0.05}%` }}
              />
            ))}
          </div>

          {quartiers.map((q, i) => {
            const liste = parQuartier[q] ?? [];
            const [lat, lng] = GPS_QUARTIERS[q];
            const { gauche, haut } = versPourcent(lat, lng);
            const premiere = liste[0];
            return (
              <Link
                key={q}
                href={`/annonces?quartier=${q}`}
                className="group absolute z-10 -translate-x-1/2 -translate-y-full hover:z-20 focus-visible:z-20"
                style={{ left: `${gauche}%`, top: `${haut}%` }}
                aria-label={`${QUARTIERS[q]} : ${liste.length} annonce${liste.length > 1 ? "s" : ""}`}
              >
                {/* Petit post-it plié avec le nombre d'annonces, et sa punaise sur le point exact */}
                <span
                  className={`colle postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} flex items-center gap-1 px-2 pt-2.5 pb-1 text-xs font-bold ${liste.length ? "" : "opacity-80"}`}
                  style={{ "--i": i, "--rot": `${(i % 3) * 3 - 3}deg` } as React.CSSProperties}
                >
                  <span className="punaise" aria-hidden />
                  <span className="titre-charte text-base">{liste.length}</span>
                  <span className="hidden max-w-24 truncate font-semibold md:inline">{QUARTIERS[q].split(" (")[0].split(",")[0]}</span>
                </span>
                {/* Au survol : le post-it complet du quartier */}
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-52 -translate-x-1/2 group-hover:block group-focus-visible:block">
                  <span className={`postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} flex flex-col gap-1 p-3 pt-4 text-left`}>
                    <strong className="text-sm">{QUARTIERS[q]}</strong>
                    {liste.slice(0, 3).map((a) => (
                      <span key={a.id} className="truncate text-xs text-encre/75">
                        {a.titre}
                      </span>
                    ))}
                    {liste.length === 0 && <span className="font-main text-sm text-encre-douce">rien encore, sois le premier</span>}
                  </span>
                </span>
              </Link>
            );
          })}

          <div className="absolute right-3 bottom-8 z-10 flex items-end gap-2">
            <Colette anim="cherche" taille={64} className="hidden sm:block" />
            {ailleurs > 0 && (
              <Link href="/annonces?quartier=hors_bordeaux" className="postit papier-gris p-2.5 pt-4 text-xs" style={{ "--rot": "2deg" } as React.CSSProperties}>
                <span className="punaise" aria-hidden />
                Ailleurs ou sans lieu : <strong>{ailleurs}</strong>
              </Link>
            )}
          </div>
        </div>
        <figcaption className="text-right text-[11px] text-encre-douce">
          ©{" "}
          <a href="https://www.openstreetmap.org/copyright" className="underline" target="_blank" rel="noreferrer">
            les contributeurs OpenStreetMap
          </a>{" "}
        </figcaption>
      </figure>

      {/* Tous les quartiers en post-it (lisible sur téléphone et pour les lecteurs d'écran) */}
      <section className="flex flex-col gap-5" aria-labelledby="par-quartier">
        <h2 id="par-quartier" className="titre-charte text-section">
          Par quartier
        </h2>
        <ul className="grid grid-cols-2 gap-x-5 gap-y-7 pt-2 sm:grid-cols-3 lg:grid-cols-4">
          {(Object.keys(QUARTIERS) as Quartier[]).map((q, i) => {
            const liste = parQuartier[q] ?? [];
            return (
              <li key={q}>
                <Link
                  href={`/annonces?quartier=${q}`}
                  className={`postit ${liste[0] ? teinte(liste[0].categorie).papier : "papier-gris"} flex h-full flex-col gap-1 p-4 pt-5`}
                  style={{ "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties}
                >
                  <span className="punaise" aria-hidden />
                  <span className="flex items-baseline justify-between gap-2">
                    <strong className="text-sm leading-tight">{QUARTIERS[q]}</strong>
                    <span className="titre-charte text-2xl">{liste.length}</span>
                  </span>
                  {liste[0] && <span className="line-clamp-2 text-xs text-encre/70">{liste[0].titre}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
