import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { suggerer } from "@/lib/matching/suggestions";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CATEGORIES, TYPES, type Categorie } from "@/lib/annonces/validation";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Annonces" };

type Filtres = { type?: string; categorie?: string };

function lienFiltre(actuels: Filtres, change: Filtres) {
  const p = new URLSearchParams();
  const f = { ...actuels, ...change };
  if (f.type) p.set("type", f.type);
  if (f.categorie) p.set("categorie", f.categorie);
  const q = p.toString();
  return q ? `/annonces?${q}` : "/annonces";
}

export default async function PageAnnonces({ searchParams }: { searchParams: Promise<Filtres> }) {
  const brut = await searchParams;
  // On ne garde que des valeurs connues : un filtre bricolé dans l'URL est ignoré.
  const filtres: Filtres = {
    type: brut.type && brut.type in TYPES ? brut.type : undefined,
    categorie: brut.categorie && brut.categorie in CATEGORIES ? brut.categorie : undefined,
  };

  const { supabase, user, profil } = await getSession();
  let requete = supabase.from("annonces").select(SELECT_ANNONCE).eq("statut", "publiee").order("cree_le", { ascending: false }).limit(60);
  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.categorie) requete = requete.eq("categorie", filtres.categorie);
  const { data } = await requete;
  const annonces = (data ?? []) as unknown as Annonce[];

  // Palier 3 : suggestions « Pour toi », seulement sur la vue sans filtre.
  const sansFiltre = !filtres.type && !filtres.categorie;
  let pourToi: ReturnType<typeof suggerer<Annonce>> = [];
  if (sansFiltre && user) {
    const { data: miennes } = await supabase.from("annonces").select("type, categorie").eq("auteur_id", user.id).eq("statut", "publiee");
    const categories = (type: string) => [...new Set((miennes ?? []).filter((m) => m.type === type).map((m) => m.categorie as Categorie))];
    pourToi = suggerer(
      { competences: profil?.competences ?? [], categoriesProposees: categories("propose"), categoriesCherchees: categories("cherche") },
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

      {annonces.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-carte border border-dashed border-ligne-forte p-6">
          <strong>Aucune annonce ici pour l&apos;instant</strong>
          <p className="text-sm text-encre-douce">Lance-toi : la première annonce de la catégorie, c&apos;est la tienne.</p>
          <BoutonLien href="/annonces/nouvelle" variante="contour">
            Publier une annonce
          </BoutonLien>
        </div>
      )}
    </div>
  );
}
