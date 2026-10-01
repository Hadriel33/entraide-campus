import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SELECT_ANNONCE, dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { CATEGORIES, CONTREPARTIES, TYPES } from "@/lib/annonces/validation";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { changerStatut, supprimerAnnonce } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lireAnnonce(id: string) {
  if (!UUID.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("annonces").select(SELECT_ANNONCE).eq("id", id).maybeSingle();
  return data as unknown as Annonce | null;
}

export async function generateMetadata({ params }: PageProps<"/annonces/[id]">): Promise<Metadata> {
  const annonce = await lireAnnonce((await params).id);
  return { title: annonce?.titre ?? "Annonce introuvable" };
}

export default async function PageAnnonce({ params }: PageProps<"/annonces/[id]">) {
  const { id } = await params;
  // La RLS ne renvoie rien si l'annonce est archivée et pas à moi : même réponse qu'une annonce inexistante.
  const annonce = await lireAnnonce(id);
  if (!annonce) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const estAuteur = user?.id === annonce.auteur_id;

  return (
    <article className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap gap-1.5">
        <Badge variante={annonce.type === "propose" ? "offre" : "besoin"}>{TYPES[annonce.type]}</Badge>
        <Badge>{CATEGORIES[annonce.categorie]}</Badge>
        {annonce.statut === "archivee" && <Badge>Archivée</Badge>}
      </div>
      <h1 className="titre-charte text-3xl sm:text-4xl">{annonce.titre}</h1>

      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-papier-fonce text-sm font-semibold" aria-hidden>
          {(annonce.auteur?.prenom ?? "?").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <p className="flex items-center gap-2 font-semibold">
            {annonce.auteur?.prenom} {annonce.auteur?.ecole && <BadgeEcole ecole={annonce.auteur.ecole} />}
          </p>
          <p className="text-sm text-encre-douce">Publiée le {dateCourte(annonce.cree_le)}</p>
        </div>
      </div>

      <p className="font-serif text-lg leading-relaxed whitespace-pre-line">{annonce.description}</p>

      <dl className="divide-y divide-ligne rounded-carte border border-ligne bg-surface text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-encre-douce">Contrepartie</dt>
          <dd className="font-medium">{CONTREPARTIES[annonce.contrepartie]}</dd>
        </div>
        {annonce.lieu && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-encre-douce">Lieu</dt>
            <dd className="font-medium">{annonce.lieu}</dd>
          </div>
        )}
      </dl>

      {estAuteur ? (
        <div className="flex flex-wrap gap-3 border-t border-ligne pt-6">
          <BoutonLien href={`/annonces/${annonce.id}/modifier`}>Modifier</BoutonLien>
          <form action={changerStatut.bind(null, annonce.id, annonce.statut === "publiee" ? "archivee" : "publiee")}>
            <Bouton variante="contour">{annonce.statut === "publiee" ? "Archiver" : "Republier"}</Bouton>
          </form>
          <form action={supprimerAnnonce.bind(null, annonce.id)}>
            <Bouton variante="danger">Supprimer</Bouton>
          </form>
        </div>
      ) : (
        <div className="rounded-carte bg-papier-fonce p-4 text-sm text-encre-douce">
          <strong className="block text-encre">Coordonnées protégées</strong>
          {annonce.auteur?.prenom} verra ta demande de contact. S&apos;il ou elle accepte, vous verrez chacun les
          coordonnées de l&apos;autre. La demande de contact arrive à la prochaine étape.
        </div>
      )}
    </article>
  );
}
