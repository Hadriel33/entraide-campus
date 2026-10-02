import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { QUARTIERS, TRAMS } from "@/lib/annonces/validation";
import { teinte } from "@/lib/design/teintes";
import {
  CADRE_BORDEAUX,
  GPS_QUARTIERS,
  ratio,
  tuiles,
  versPourcent,
} from "@/lib/carte/mercator";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Carte" };

type Quartier = keyof typeof QUARTIERS;
type Mini = {
  id: string;
  titre: string;
  categorie: string;
  quartier: Quartier | null;
};

const CLASSE_TRAM: Record<string, string> = {
  A: "bg-tram-a",
  B: "bg-tram-b",
  C: "bg-tram-c",
  D: "bg-tram-d",
};

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
  const ailleurs =
    (parQuartier.hors_bordeaux?.length ?? 0) +
    annonces.filter((a) => !a.quartier).length;
  const quartiers = Object.keys(
    GPS_QUARTIERS,
  ) as (keyof typeof GPS_QUARTIERS)[];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Bordeaux et ses environs : chaque punaise est un quartier. Clique pour voir ses annonces.">
          La carte
        </TitrePage>
        <nav
          className="flex flex-wrap items-center gap-2 text-sm font-semibold"
          aria-label="Lignes de tram"
        >
          {TRAMS.map((t) => (
            <Link
              key={t}
              href={`/annonces?tram=${t}`}
              className={`presse rounded-ui px-2.5 py-1 text-surface ${CLASSE_TRAM[t]}`}
            >
              Tram {t}
            </Link>
          ))}
        </nav>
      </div>

      <figure className="flex flex-col gap-2">
        <div
          className="relative w-full overflow-hidden rounded-carte border border-ligne bg-papier-fonce"
          style={{ aspectRatio: ratio() }}
        >
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
                style={{
                  left: `${t.gauche}%`,
                  top: `${t.haut}%`,
                  width: `${t.largeur + 0.05}%`,
                  height: `${t.hauteur + 0.05}%`,
                }}
              />
            ))}
          </div>

          {quartiers.map((q, i) => {
            const liste = parQuartier[q] ?? [];
            const [lat, lng] = GPS_QUARTIERS[q];
            const { gauche, haut } = versPourcent(lat, lng);
            const premiere = liste[0];
            return (
              <div
                key={q}
                className={`group absolute -translate-x-1/2 -translate-y-full hover:z-20 focus-within:z-20 ${q === "victor_hugo" ? "z-[15]" : "z-10"}`}
                style={{ left: `${gauche}%`, top: `${haut}%` }}
              >
                {/* Clic : le post-it du quartier s'ouvre sur la carte (popover natif), avec ses annonces. */}
                <button
                  type="button"
                  popoverTarget={`quartier-${q}`}
                  className="block cursor-pointer"
                  aria-label={`${QUARTIERS[q]} : ${liste.length} annonce${liste.length > 1 ? "s" : ""}`}
                >
                  {/* Petit post-it plié avec le nombre d'annonces, et sa punaise sur le point exact */}
                  <span
                    className={`colle postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} flex items-center gap-1 px-2 pt-2.5 pb-1 text-xs font-bold ${liste.length ? "" : "opacity-80"}`}
                    style={
                      {
                        "--i": i,
                        "--rot": `${(i % 3) * 3 - 3}deg`,
                      } as React.CSSProperties
                    }
                  >
                    <span className="punaise" aria-hidden />
                    {/* Seulement le nombre : les quartiers du centre sont proches, des noms se chevaucheraient
                        (trouvé par le parcours Playwright). Le nom est dans l'aperçu au survol et dans le post-it. */}
                    <span className="titre-charte text-base">
                      {liste.length}
                    </span>
                  </span>
                </button>
                {/* Au survol : un aperçu */}
                <span
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden w-52 -translate-x-1/2 group-hover:block"
                  aria-hidden
                >
                  <span
                    className={`postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} flex flex-col gap-1 p-3 pt-4 text-left`}
                  >
                    <strong className="text-sm">{QUARTIERS[q]}</strong>
                    {liste.slice(0, 3).map((a) => (
                      <span
                        key={a.id}
                        className="truncate text-xs text-encre/75"
                      >
                        {a.titre}
                      </span>
                    ))}
                    {liste.length === 0 ? (
                      <span className="font-main text-sm text-encre-douce">
                        rien encore, sois le premier
                      </span>
                    ) : (
                      <span className="font-main text-sm text-alerte">
                        clique pour ouvrir
                      </span>
                    )}
                  </span>
                </span>
                <div
                  id={`quartier-${q}`}
                  popover="auto"
                  className="m-auto w-[min(24rem,calc(100vw-2rem))] overflow-visible border-0 bg-transparent p-3 text-encre backdrop:bg-encre/30"
                >
                  <div
                    className={`postit ${premiere ? teinte(premiere.categorie).papier : "papier-gris"} pop flex flex-col gap-3 p-6 pt-8`}
                    style={{ "--rot": "-1deg" } as React.CSSProperties}
                  >
                    <span className="punaise" aria-hidden />
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="titre-charte text-xs">Quartier</span>
                        <strong className="text-xl leading-tight">
                          {QUARTIERS[q]}
                        </strong>
                      </div>
                      <span className="titre-charte text-3xl">
                        {liste.length}
                      </span>
                    </div>
                    {liste.length > 0 ? (
                      <ul className="flex flex-col gap-1.5">
                        {liste.slice(0, 6).map((a) => (
                          <li key={a.id}>
                            <Link
                              href={`/annonces/${a.id}`}
                              className="flex items-center gap-2 rounded-ui bg-surface/60 px-2.5 py-1.5 text-sm font-semibold hover:bg-surface"
                            >
                              <span
                                className={`size-2.5 shrink-0 rounded-full ${teinte(a.categorie).point}`}
                                aria-hidden
                              />
                              <span className="truncate">{a.titre}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="flex items-center gap-3">
                        <Colette anim="cherche" taille={52} saison={false} />
                        <p className="font-main text-lg">
                          Rien encore ici. Sois le premier du quartier !
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={
                          liste.length
                            ? `/annonces?quartier=${q}`
                            : "/annonces/nouvelle"
                        }
                        className="-rotate-2 font-main text-xl text-alerte hover:underline"
                      >
                        {liste.length > 6
                          ? `voir les ${liste.length}`
                          : liste.length
                            ? "voir en liste"
                            : "publier ici"}
                      </Link>
                      <button
                        type="button"
                        popoverTarget={`quartier-${q}`}
                        popoverTargetAction="hide"
                        className="text-sm font-semibold text-encre-douce hover:text-encre"
                      >
                        Fermer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Colette décore seulement : elle ne doit jamais bloquer le clic sur une punaise. */}
          <Colette
            anim="cherche"
            taille={64}
            className="pointer-events-none absolute right-3 bottom-8 z-0 hidden sm:block"
          />
        </div>
        {/* Sous la carte (et plus dessus) : sur téléphone, ce post-it cachait la punaise de Bègles. */}
        <figcaption className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-encre-douce">
          {ailleurs > 0 ? (
            <Link
              href="/annonces?quartier=hors_bordeaux"
              className="rounded-ui bg-postit-gris px-2.5 py-1 text-xs font-semibold text-encre hover:underline"
            >
              Ailleurs ou sans lieu : {ailleurs}
            </Link>
          ) : (
            <span />
          )}
          <span>
            ©{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              les contributeurs OpenStreetMap
            </a>{" "}
          </span>
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
                  style={
                    { "--rot": `${(i % 3) - 1}deg` } as React.CSSProperties
                  }
                >
                  <span className="punaise" aria-hidden />
                  <span className="flex items-baseline justify-between gap-2">
                    <strong className="text-sm leading-tight">
                      {QUARTIERS[q]}
                    </strong>
                    <span className="titre-charte text-2xl">
                      {liste.length}
                    </span>
                  </span>
                  {liste[0] && (
                    <span className="line-clamp-2 text-xs text-encre/70">
                      {liste[0].titre}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
