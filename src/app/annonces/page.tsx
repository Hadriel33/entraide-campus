import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { suggerer } from "@/lib/matching/suggestions";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { normaliserRecherche } from "@/lib/annonces/recherche";
import { CATEGORIES, QUARTIERS, TRAMS, TYPES, type Categorie } from "@/lib/annonces/validation";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { ChecklistAccueil } from "@/components/profil/checklist-accueil";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Annonces" };

type Filtres = { type?: string; categorie?: string; q?: string; quartier?: string; tram?: string };

function lienFiltre(actuels: Filtres, change: Filtres) {
  const p = new URLSearchParams();
  const f = { ...actuels, ...change };
  for (const cle of ["q", "type", "categorie", "quartier", "tram"] as const) if (f[cle]) p.set(cle, f[cle]!);
  const q = p.toString();
  return q ? `/annonces?${q}` : "/annonces";
}

const CLASSE_SAISIE = "min-h-10 rounded-ui border border-ligne-forte bg-surface px-3 text-sm outline-none focus:border-encre";

export default async function PageAnnonces({ searchParams }: { searchParams: Promise<Filtres> }) {
  const brut = await searchParams;
  // On ne garde que des valeurs connues : un filtre bricolé dans l'URL est ignoré.
  const filtres: Filtres = {
    type: brut.type && brut.type in TYPES ? brut.type : undefined,
    categorie: brut.categorie && brut.categorie in CATEGORIES ? brut.categorie : undefined,
    quartier: brut.quartier && brut.quartier in QUARTIERS ? brut.quartier : undefined,
    tram: brut.tram && (TRAMS as readonly string[]).includes(brut.tram) ? brut.tram : undefined,
    q: typeof brut.q === "string" && brut.q.trim() ? brut.q.trim().slice(0, 80) : undefined,
  };
  const recherche = filtres.q ? normaliserRecherche(filtres.q) : "";

  const { supabase, user, profil } = await getSession();
  let requete = supabase
    .from("annonces")
    .select(SELECT_ANNONCE)
    .eq("statut", "publiee")
    .gt("expire_le", new Date().toISOString()) // les annonces expirées disparaissent de la liste
    .order("cree_le", { ascending: false })
    .limit(60);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.categorie) requete = requete.eq("categorie", filtres.categorie);
  if (filtres.quartier) requete = requete.eq("quartier", filtres.quartier);
  if (filtres.tram) requete = requete.eq("tram", filtres.tram);
  if (recherche) requete = requete.textSearch("recherche", recherche, { type: "websearch", config: "french" });
  const { data } = await requete;
  const annonces = (data ?? []) as unknown as Annonce[];

  // Palier 3 : suggestions « Pour toi », et accueil guidé, seulement sur la vue sans filtre.
  const sansFiltre = !filtres.type && !filtres.categorie && !filtres.quartier && !filtres.tram && !recherche;
  let pourToi: ReturnType<typeof suggerer<Annonce>> = [];
  let etatAccueil = null;
  if (sansFiltre && user && profil) {
    const [{ data: miennes }, etat] = await Promise.all([
      supabase.from("annonces").select("type, categorie").eq("auteur_id", user.id).eq("statut", "publiee"),
      lireEtatAccueil(supabase, profil),
    ]);
    etatAccueil = etat;
    const categories = (type: string) => [...new Set((miennes ?? []).filter((m) => m.type === type).map((m) => m.categorie as Categorie))];
    pourToi = suggerer(
      { competences: profil.competences ?? [], categoriesProposees: categories("propose"), categoriesCherchees: categories("cherche") },
      annonces.filter((a) => a.auteur_id !== user.id),
    );
  }

  const onglets = [{ valeur: undefined, label: "Tout" }, ...Object.entries(TYPES).map(([valeur, label]) => ({ valeur, label }))];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Étudiants de l'ESD et de l'ESP Bordeaux. Les coordonnées s'échangent seulement après accord.">
          Les annonces du campus
        </TitrePage>
        <BoutonLien href="/annonces/nouvelle">Publier une annonce</BoutonLien>
      </div>

      {etatAccueil && <ChecklistAccueil etat={etatAccueil} />}

      {/* Recherche et filtres de lieu : un simple formulaire GET (fonctionne sans JavaScript, URL partageable). */}
      <form action="/annonces" className="flex flex-wrap items-end gap-2" role="search">
        {filtres.type && <input type="hidden" name="type" value={filtres.type} />}
        {filtres.categorie && <input type="hidden" name="categorie" value={filtres.categorie} />}
        <label className="flex min-w-60 flex-1 flex-col gap-1 text-xs font-semibold">
          Rechercher
          <input
            type="search"
            name="q"
            defaultValue={filtres.q}
            placeholder="Photographe, coloc, Figma, covoiturage..."
            className={`${CLASSE_SAISIE} text-base font-normal`}
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold">
          Quartier
          <select name="quartier" defaultValue={filtres.quartier ?? ""} className={CLASSE_SAISIE}>
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
          <select name="tram" defaultValue={filtres.tram ?? ""} className={CLASSE_SAISIE}>
            <option value="">Toutes</option>
            {TRAMS.map((t) => (
              <option key={t} value={t}>
                Ligne {t}
              </option>
            ))}
          </select>
        </label>
        <Bouton>Chercher</Bouton>
        {(filtres.q || filtres.quartier || filtres.tram) && (
          <BoutonLien href={lienFiltre({ type: filtres.type, categorie: filtres.categorie }, {})} variante="discret">
            Effacer
          </BoutonLien>
        )}
      </form>

      <div className="flex flex-col gap-3">
        <nav className="inline-flex self-start rounded-ui bg-papier-fonce p-1" aria-label="Type d'annonce">
          {onglets.map((o) => {
            const actif = filtres.type === o.valeur;
            return (
              <Link
                key={o.label}
                href={lienFiltre(filtres, { type: o.valeur })}
                aria-current={actif ? "page" : undefined}
                className="rounded-[4px] px-3.5 py-1.5 text-sm font-medium text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
              >
                {o.label}
              </Link>
            );
          })}
        </nav>
        <nav className="flex flex-wrap gap-1.5" aria-label="Catégories">
          {[["", "Toutes"] as const, ...Object.entries(CATEGORIES)].map(([valeur, label]) => {
            const actif = (filtres.categorie ?? "") === valeur;
            return (
              <Link
                key={valeur || "toutes"}
                href={lienFiltre(filtres, { categorie: valeur || undefined })}
                aria-current={actif ? "page" : undefined}
                className="rounded-full border border-ligne bg-surface px-3 py-1 text-sm hover:border-ligne-forte aria-[current=page]:border-encre aria-[current=page]:bg-encre aria-[current=page]:text-surface"
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {pourToi.length > 0 && (
        <section className="apparition flex flex-col gap-3 rounded-carte border border-encre bg-surface p-4" aria-labelledby="pour-toi">
          <h2 id="pour-toi" className="titre-charte text-xl">
            Pour toi
          </h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {pourToi.map(({ annonce, raison }, i) => (
              <li key={annonce.id} className="apparition" style={{ "--i": i } as React.CSSProperties}>
                <Link href={`/annonces/${annonce.id}`} className="souleve flex h-full flex-col gap-1 rounded-ui bg-papier-fonce p-3">
                  <span className="text-xs font-semibold">{raison}</span>
                  <span className="font-medium leading-snug">{annonce.titre}</span>
                  <span className="text-xs text-encre-douce">@{annonce.auteur?.pseudo}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {recherche && (
        <p className="text-sm text-encre-douce">
          {annonces.length} résultat{annonces.length > 1 ? "s" : ""} pour « {filtres.q} »
        </p>
      )}

      {annonces.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-carte border border-dashed border-ligne-forte p-6">
          <strong>{sansFiltre ? "Aucune annonce pour l'instant" : "Aucune annonce ne correspond"}</strong>
          <p className="text-sm text-encre-douce">
            {sansFiltre ? "Lance-toi : la première annonce, c'est la tienne." : "Essaie d'autres mots ou retire un filtre. Ou publie ce que tu cherches : quelqu'un te répondra."}
          </p>
          <BoutonLien href="/annonces/nouvelle" variante="contour">
            Publier une annonce
          </BoutonLien>
        </div>
      )}
    </div>
  );
}
