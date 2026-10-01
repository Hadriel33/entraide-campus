import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { suggerer } from "@/lib/matching/suggestions";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { normaliserRecherche } from "@/lib/annonces/recherche";
import {
  CATEGORIES,
  CONTREPARTIES,
  QUARTIERS,
  TRAMS,
  TYPES,
  type Categorie,
} from "@/lib/annonces/validation";
import { ECOLES } from "@/lib/auth/validation";
import { TEINTES, inclinaison, teinte } from "@/lib/design/teintes";
import { LigneAnnonce } from "@/components/annonces/ligne-annonce";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { ChecklistAccueil } from "@/components/profil/checklist-accueil";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { EtatVide } from "@/components/colette/etat-vide";

export const metadata: Metadata = { title: "Annonces" };

type Filtres = {
  type?: string;
  categorie?: string;
  q?: string;
  quartier?: string;
  tram?: string;
  ecole?: string;
  contrepartie?: string;
  tri?: string;
  page?: string;
  vue?: string;
};

const PAR_PAGE = 30;

function lienFiltre(actuels: Filtres, change: Filtres) {
  const p = new URLSearchParams();
  const f = { ...actuels, ...change };
  for (const cle of [
    "q",
    "type",
    "categorie",
    "quartier",
    "tram",
    "ecole",
    "contrepartie",
    "tri",
    "page",
    "vue",
  ] as const)
    if (f[cle]) p.set(cle, f[cle]!);
  const q = p.toString();
  return q ? `/annonces?${q}` : "/annonces";
}

const CLASSE_SAISIE =
  "min-h-10 rounded-ui border border-ligne-forte bg-surface px-3 text-sm outline-none focus:border-encre";

export default async function PageAnnonces({
  searchParams,
}: {
  searchParams: Promise<Filtres>;
}) {
  const brut = await searchParams;
  // On ne garde que des valeurs connues : un filtre bricolé dans l'URL est ignoré.
  const filtres: Filtres = {
    type: brut.type && brut.type in TYPES ? brut.type : undefined,
    categorie:
      brut.categorie && brut.categorie in CATEGORIES
        ? brut.categorie
        : undefined,
    quartier:
      brut.quartier && brut.quartier in QUARTIERS ? brut.quartier : undefined,
    tram:
      brut.tram && (TRAMS as readonly string[]).includes(brut.tram)
        ? brut.tram
        : undefined,
    q:
      typeof brut.q === "string" && brut.q.trim()
        ? brut.q.trim().slice(0, 80)
        : undefined,
    ecole:
      brut.ecole && (ECOLES as readonly string[]).includes(brut.ecole)
        ? brut.ecole
        : undefined,
    contrepartie:
      brut.contrepartie && brut.contrepartie in CONTREPARTIES
        ? brut.contrepartie
        : undefined,
    tri: brut.tri === "bientot" ? "bientot" : undefined,
    vue: brut.vue === "liste" ? "liste" : undefined,
    page: brut.page && /^[2-5]$/.test(brut.page) ? brut.page : undefined,
  };
  const limite = PAR_PAGE * Number(filtres.page ?? 1);
  const recherche = filtres.q ? normaliserRecherche(filtres.q) : "";

  const { supabase, user, profil } = await getSession();
  const maintenant = new Date().toISOString();
  // Filtre par école : jointure obligatoire (!inner) sur le profil de l'auteur.
  const select = filtres.ecole
    ? SELECT_ANNONCE.replace("auteur:profils(", "auteur:profils!inner(")
    : SELECT_ANNONCE;
  let requete = supabase
    .from("annonces")
    .select(select)
    .eq("statut", "publiee")
    .gt("expire_le", maintenant) // les annonces expirées disparaissent de la liste
    .order(filtres.tri === "bientot" ? "expire_le" : "cree_le", {
      ascending: filtres.tri === "bientot",
    })
    .limit(limite);
  if (filtres.ecole) requete = requete.eq("auteur.ecole", filtres.ecole);
  if (filtres.contrepartie)
    requete = requete.eq("contrepartie", filtres.contrepartie);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.categorie) requete = requete.eq("categorie", filtres.categorie);
  if (filtres.quartier) requete = requete.eq("quartier", filtres.quartier);
  if (filtres.tram) requete = requete.eq("tram", filtres.tram);
  if (recherche)
    requete = requete.textSearch("recherche", recherche, {
      type: "websearch",
      config: "french",
    });
  const [{ data }, { data: toutes }] = await Promise.all([
    requete,
    // Nombre d'annonces actives par catégorie (affiché sur les filtres).
    supabase
      .from("annonces")
      .select("categorie")
      .eq("statut", "publiee")
      .gt("expire_le", maintenant)
      .limit(2000),
  ]);
  const annonces = (data ?? []) as unknown as Annonce[];
  const parCategorie = (toutes ?? []).reduce<Record<string, number>>(
    (acc, a) => ({ ...acc, [a.categorie]: (acc[a.categorie] ?? 0) + 1 }),
    {},
  );
  const actifs = [
    filtres.q && { cle: "q", label: `« ${filtres.q} »` },
    filtres.type && {
      cle: "type",
      label: TYPES[filtres.type as keyof typeof TYPES],
    },
    filtres.categorie && {
      cle: "categorie",
      label: CATEGORIES[filtres.categorie as Categorie],
    },
    filtres.quartier && {
      cle: "quartier",
      label: QUARTIERS[filtres.quartier as keyof typeof QUARTIERS],
    },
    filtres.tram && { cle: "tram", label: `Tram ${filtres.tram}` },
    filtres.ecole && { cle: "ecole", label: filtres.ecole },
    filtres.contrepartie && {
      cle: "contrepartie",
      label: CONTREPARTIES[filtres.contrepartie as keyof typeof CONTREPARTIES],
    },
  ].filter(Boolean) as { cle: keyof Filtres; label: string }[];

  // Palier 3 : suggestions « Pour toi », et accueil guidé, seulement sur la vue sans filtre.
  const sansFiltre = actifs.length === 0;
  let pourToi: ReturnType<typeof suggerer<Annonce>> = [];
  let etatAccueil = null;
  if (sansFiltre && user && profil) {
    const [{ data: miennes }, etat] = await Promise.all([
      supabase
        .from("annonces")
        .select("type, categorie")
        .eq("auteur_id", user.id)
        .eq("statut", "publiee"),
      lireEtatAccueil(supabase, profil),
    ]);
    etatAccueil = etat;
    const categories = (type: string) => [
      ...new Set(
        (miennes ?? [])
          .filter((m) => m.type === type)
          .map((m) => m.categorie as Categorie),
      ),
    ];
    pourToi = suggerer(
      {
        competences: profil.competences ?? [],
        categoriesProposees: categories("propose"),
        categoriesCherchees: categories("cherche"),
      },
      annonces.filter((a) => a.auteur_id !== user.id),
    );
  }

  const onglets = [
    { valeur: undefined, label: "Tout" },
    ...Object.entries(TYPES).map(([valeur, label]) => ({ valeur, label })),
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Étudiants de l'ESD et de l'ESP Bordeaux. Les coordonnées s'échangent seulement après accord.">
          Les annonces du campus
        </TitrePage>
        <BoutonLien href="/annonces/nouvelle">Publier une annonce</BoutonLien>
      </div>

      {etatAccueil && <ChecklistAccueil etat={etatAccueil} />}

      {/* Recherche et filtres de lieu : un simple formulaire GET (fonctionne sans JavaScript, URL partageable). */}
      <form
        action="/annonces"
        className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-3 sm:p-4"
        role="search"
      >
        {filtres.type && (
          <input type="hidden" name="type" value={filtres.type} />
        )}
        {filtres.categorie && (
          <input type="hidden" name="categorie" value={filtres.categorie} />
        )}
        {filtres.tri && <input type="hidden" name="tri" value={filtres.tri} />}
        <div className="flex gap-2">
          <label className="relative flex flex-1">
            <span className="sr-only">Rechercher</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-encre-douce"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              name="q"
              defaultValue={filtres.q}
              placeholder="Photographe, coloc, Figma, covoiturage..."
              className="min-h-12 w-full rounded-ui border border-ligne-forte bg-papier pr-3 pl-11 text-base outline-none focus:border-encre focus:bg-surface"
            />
          </label>
          <Bouton className="min-h-12 px-5">Chercher</Bouton>
        </div>
        <details
          className="group/filtres"
          open={
            !!(
              filtres.quartier ||
              filtres.tram ||
              filtres.ecole ||
              filtres.contrepartie
            )
          }
        >
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre [&::-webkit-details-marker]:hidden">
            <svg
              viewBox="0 0 24 24"
              className="size-4 transition-transform group-open/filtres:rotate-90"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
            Plus de filtres : quartier, tram, école, contrepartie
          </summary>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Quartier
              <select
                name="quartier"
                defaultValue={filtres.quartier ?? ""}
                className={CLASSE_SAISIE}
              >
                <option value="">Tout Bordeaux</option>
                {Object.entries(QUARTIERS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Tram
              <select
                name="tram"
                defaultValue={filtres.tram ?? ""}
                className={CLASSE_SAISIE}
              >
                <option value="">Toutes</option>
                {TRAMS.map((t) => (
                  <option key={t} value={t}>
                    Ligne {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              École
              <select
                name="ecole"
                defaultValue={filtres.ecole ?? ""}
                className={CLASSE_SAISIE}
              >
                <option value="">Les deux</option>
                {ECOLES.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold">
              Contrepartie
              <select
                name="contrepartie"
                defaultValue={filtres.contrepartie ?? ""}
                className={CLASSE_SAISIE}
              >
                <option value="">Toutes</option>
                {Object.entries(CONTREPARTIES).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </details>
      </form>

      {/* Filtres actifs : une pastille par filtre, la croix le retire. */}
      {actifs.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-1.5"
          aria-label="Filtres actifs"
        >
          {actifs.map((f) => (
            <Link
              key={f.cle}
              href={lienFiltre(
                { ...filtres, page: undefined },
                { [f.cle]: undefined },
              )}
              className="pop presse flex items-center gap-1.5 rounded-full bg-encre py-1 pr-2 pl-3 text-sm text-surface hover:bg-encre/85"
              aria-label={`Retirer le filtre ${f.label}`}
            >
              {f.label}
              <svg
                viewBox="0 0 24 24"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                aria-hidden
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </Link>
          ))}
          <Link
            href="/annonces"
            className="px-2 text-sm text-encre-douce underline-offset-2 hover:underline"
          >
            Tout effacer
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <nav
            className="inline-flex self-start rounded-ui bg-papier-fonce p-1"
            aria-label="Type d'annonce"
          >
            {onglets.map((o) => {
              const actif = filtres.type === o.valeur;
              return (
                <Link
                  key={o.label}
                  href={lienFiltre(
                    { ...filtres, page: undefined },
                    { type: o.valeur },
                  )}
                  aria-current={actif ? "page" : undefined}
                  className="rounded-[4px] px-3.5 py-1.5 text-sm font-medium text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
                >
                  {o.label}
                </Link>
              );
            })}
          </nav>
          <nav
            className="inline-flex rounded-ui bg-papier-fonce p-1 text-sm"
            aria-label="Tri"
          >
            {[
              { tri: undefined, label: "Plus récentes" },
              { tri: "bientot", label: "Expirent bientôt" },
            ].map((o) => (
              <Link
                key={o.label}
                href={lienFiltre(
                  { ...filtres, page: undefined },
                  { tri: o.tri },
                )}
                aria-current={filtres.tri === o.tri ? "page" : undefined}
                className="rounded-[4px] px-3 py-1.5 font-medium text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
              >
                {o.label}
              </Link>
            ))}
          </nav>
        </div>
        <nav className="flex flex-wrap gap-1.5" aria-label="Catégories">
          {[["", "Toutes"] as const, ...Object.entries(CATEGORIES)].map(
            ([valeur, label]) => {
              const actif = (filtres.categorie ?? "") === valeur;
              const nombre = valeur
                ? (parCategorie[valeur] ?? 0)
                : (toutes?.length ?? 0);
              return (
                <Link
                  key={valeur || "toutes"}
                  href={lienFiltre(
                    { ...filtres, page: undefined },
                    { categorie: valeur || undefined },
                  )}
                  aria-current={actif ? "page" : undefined}
                  className="presse group/chip flex items-center gap-1.5 rounded-full border border-ligne bg-surface px-3 py-1 text-sm hover:border-ligne-forte aria-[current=page]:border-encre aria-[current=page]:bg-encre aria-[current=page]:text-surface"
                >
                  {valeur && (
                    <span
                      className={`size-2 rounded-full ${teinte(valeur).point}`}
                      aria-hidden
                    />
                  )}
                  {label}
                  <span className="text-xs text-encre-douce group-aria-[current=page]/chip:text-surface/70">
                    {nombre}
                  </span>
                </Link>
              );
            },
          )}
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-encre-douce">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1" aria-label="Légende des couleurs">
            <span className="font-semibold">Les couleurs :</span>
            {Object.values(TEINTES).map((t) => (
              <span key={t.famille} className="flex items-center gap-1.5">
                <span className={`size-3 rounded-[2px] ${t.point}`} aria-hidden />
                {t.famille}
              </span>
            ))}
          </p>
          <nav className="inline-flex rounded-ui bg-papier-fonce p-1" aria-label="Affichage">
            {[
              { vue: undefined, label: "Mur" },
              { vue: "liste", label: "Liste" },
            ].map((o) => (
              <Link
                key={o.label}
                href={lienFiltre(filtres, { vue: o.vue })}
                aria-current={filtres.vue === o.vue ? "page" : undefined}
                scroll={false}
                className="rounded-[4px] px-3 py-1 text-sm font-semibold aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
              >
                {o.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {pourToi.length > 0 && (
        <section className="flex flex-col gap-4" aria-labelledby="pour-toi">
          <h2 id="pour-toi" className="flex items-baseline gap-3">
            <span className="titre-charte text-section">Pour toi</span>
            <span className="-rotate-2 font-main text-lg text-encre-douce">
              choisi d&apos;après ton profil
            </span>
          </h2>
          <ul className="grid gap-5 sm:grid-cols-3">
            {pourToi.map(({ annonce, raison }, i) => (
              <li
                key={annonce.id}
                className="apparition"
                style={{ "--i": i } as React.CSSProperties}
              >
                <Link
                  href={`/annonces/${annonce.id}`}
                  className={`postit ${teinte(annonce.categorie).papier} flex h-full flex-col gap-1 p-4`}
                  style={
                    {
                      "--rot": `${inclinaison(annonce.id) / 2}deg`,
                    } as React.CSSProperties
                  }
                >
                  <span className="text-xs font-semibold">{raison}</span>
                  <span className="font-medium leading-snug">
                    {annonce.titre}
                  </span>
                  <span className="text-xs text-encre-douce">
                    @{annonce.auteur?.pseudo}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recherche && (
        <p className="text-sm text-encre-douce">
          {annonces.length} résultat{annonces.length > 1 ? "s" : ""} pour «{" "}
          {filtres.q} »
        </p>
      )}

      {annonces.length > 0 && filtres.vue === "liste" ? (
        <ul className="flex flex-col gap-1.5">
          {annonces.map((a) => (
            <LigneAnnonce key={a.id} annonce={a} />
          ))}
        </ul>
      ) : annonces.length > 0 ? (
        <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i % PAR_PAGE} />
          ))}
        </div>
      ) : (
        <EtatVide
          anim={sansFiltre ? "accroche" : "cherche"}
          titre={sansFiltre ? "Le mur est encore vide" : "Colette n'a rien trouvé"}
          action={
            <BoutonLien href="/annonces/nouvelle" variante="contour">
              Publier une annonce
            </BoutonLien>
          }
        >
          {sansFiltre
            ? "Lance-toi : la première annonce, c'est la tienne."
            : "Essaie d'autres mots ou retire un filtre. Ou publie ce que tu cherches : quelqu'un te répondra."}
        </EtatVide>
      )}

      {annonces.length === limite && limite < PAR_PAGE * 5 && (
        <BoutonLien
          href={lienFiltre(filtres, {
            page: String(Number(filtres.page ?? 1) + 1),
          })}
          variante="contour"
          className="self-center"
          scroll={false}
        >
          Voir plus d&apos;annonces
        </BoutonLien>
      )}
    </div>
  );
}
