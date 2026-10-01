import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { SELECT_ANNONCE, dateCourte, type Annonce } from "@/lib/annonces/requetes";
import { CATEGORIES, CONTREPARTIES, TYPES } from "@/lib/annonces/validation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { BlocCoordonnees, type Coordonnees } from "@/components/demandes/coordonnees";
import { FormulaireAvis } from "@/components/demandes/formulaire-avis";
import { annulerDemande, demanderContact, signalerAnnonce } from "@/app/demandes/actions";
import { changerStatut, supprimerAnnonce } from "../actions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lireAnnonce(id: string) {
  if (!UUID.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase.from("annonces").select(SELECT_ANNONCE).eq("id", id).maybeSingle();
  return data as unknown as Annonce | null;
}

export async function generateMetadata({ params }: PageProps<"/annonces/[id]">): Promise<Metadata> {
  const annonce = await lireAnnonce((await params).id);
  return { title: annonce?.titre ?? "Annonce introuvable" };
}

export default async function PageAnnonce({ params }: PageProps<"/annonces/[id]">) {
  const { id } = await params;
  // La RLS ne renvoie rien si l'annonce n'est pas visible pour moi : même réponse qu'une annonce inexistante.
  const annonce = await lireAnnonce(id);
  if (!annonce) notFound();

  const { supabase, user } = await getSession();
  const estAuteur = user?.id === annonce.auteur_id;
  const prenom = annonce.auteur?.prenom ?? "l'auteur";

  // Ma demande sur cette annonce (s'il y en a une), et ce qui en découle.
  const { data: demande } = estAuteur
    ? { data: null }
    : await supabase.from("demandes_contact").select("id, statut").eq("annonce_id", annonce.id).eq("demandeur_id", user!.id).maybeSingle();
  // Les coordonnées ne sont demandées QUE si la demande est acceptée ; sinon la RLS ne les renverrait de toute façon pas.
  const { data: coordonnees } =
    demande?.statut === "acceptee"
      ? await supabase.from("coordonnees").select("telephone, email, reseau").eq("id", annonce.auteur_id).maybeSingle<Coordonnees>()
      : { data: null };
  const { data: monAvis } =
    demande?.statut === "acceptee" ? await supabase.from("avis").select("id").eq("demande_id", demande.id).eq("auteur_id", user!.id).maybeSingle() : { data: null };

  return (
    <article className="apparition flex w-full max-w-2xl flex-col gap-6">
      <Link href="/annonces" className="text-sm text-encre-douce hover:text-encre">
        Retour aux annonces
      </Link>
      <div className="flex flex-wrap gap-1.5">
        <Badge variante={annonce.type === "propose" ? "offre" : "besoin"}>{TYPES[annonce.type]}</Badge>
        <Badge>{CATEGORIES[annonce.categorie]}</Badge>
        {annonce.statut === "archivee" && <Badge>Archivée</Badge>}
        {annonce.statut === "masquee" && <Badge>Masquée par la modération</Badge>}
      </div>
      <h1 className="titre-charte text-3xl sm:text-4xl">{annonce.titre}</h1>

      <Link href={`/profils/${annonce.auteur?.pseudo}`} className="presse flex items-center gap-3 self-start rounded-ui pr-3 hover:bg-papier-fonce">
        <Avatar chemin={annonce.auteur?.avatar_chemin} nom={annonce.auteur?.pseudo ?? "?"} taille="lg" />
        <div>
          <p className="flex items-center gap-2 font-semibold">
            @{annonce.auteur?.pseudo} {annonce.auteur?.ecole && <BadgeEcole ecole={annonce.auteur.ecole} />}
          </p>
          <p className="text-sm text-encre-douce">
            {prenom} · publiée le {dateCourte(annonce.cree_le)}
          </p>
        </div>
      </Link>

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

      {estAuteur && annonce.statut === "masquee" && (
        <p role="status" className="rounded-carte bg-besoin p-4 text-sm">
          <strong className="block">Annonce en attente de vérification</strong>
          Elle n&apos;est pas visible des autres étudiants pour le moment. Un modérateur va la relire rapidement.
        </p>
      )}

      {estAuteur ? (
        <div className="flex flex-wrap gap-3 border-t border-ligne pt-6">
          <BoutonLien href={`/annonces/${annonce.id}/modifier`}>Modifier</BoutonLien>
          {annonce.statut !== "masquee" && (
            <form action={changerStatut.bind(null, annonce.id, annonce.statut === "publiee" ? "archivee" : "publiee")}>
              <Bouton variante="contour">{annonce.statut === "publiee" ? "Archiver" : "Republier"}</Bouton>
            </form>
          )}
          <form action={supprimerAnnonce.bind(null, annonce.id)}>
            <Bouton variante="danger">Supprimer</Bouton>
          </form>
        </div>
      ) : (
        <section className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-4" aria-labelledby="titre-contact">
          <h2 id="titre-contact" className="font-semibold">
            Contacter {prenom}
          </h2>

          {!demande && (
            <form action={demanderContact.bind(null, annonce.id)} className="flex flex-col gap-3">
              <p className="text-sm text-encre-douce">
                Ses coordonnées restent cachées. Si {prenom} accepte ta demande, vous verrez chacun les coordonnées de l&apos;autre.
              </p>
              <textarea
                name="message"
                maxLength={300}
                rows={3}
                placeholder={`Un petit mot pour ${prenom} (facultatif) : qui tu es, quand tu es dispo...`}
                className="rounded-ui border border-ligne-forte bg-surface px-3 py-2 text-sm outline-none focus:border-encre"
              />
              <Bouton className="self-start">Demander le contact</Bouton>
            </form>
          )}

          {demande?.statut === "en_attente" && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm">
                <Badge>En attente</Badge> {prenom} n&apos;a pas encore répondu.
              </p>
              <form action={annulerDemande.bind(null, demande.id, annonce.id)}>
                <Bouton variante="discret">Annuler ma demande</Bouton>
              </form>
            </div>
          )}

          {demande?.statut === "refusee" && (
            <p className="flex items-center gap-2 text-sm text-encre-douce">
              <Badge>Refusée</Badge> {prenom} a décliné ta demande. Pas de souci, d&apos;autres annonces t&apos;attendent.
            </p>
          )}

          {demande?.statut === "acceptee" && (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm">
                <Badge variante="ok">Acceptée</Badge> Tu peux contacter {prenom} :
              </p>
              <BlocCoordonnees c={coordonnees} prenom={prenom} />
              {!monAvis && <FormulaireAvis demandeId={demande.id} retour={`/annonces/${annonce.id}`} prenom={prenom} />}
            </div>
          )}
        </section>
      )}

      {!estAuteur && (
        <details className="text-sm">
          <summary className="cursor-pointer text-encre-douce hover:text-encre">Signaler cette annonce</summary>
          <form action={signalerAnnonce.bind(null, annonce.id)} className="mt-3 flex flex-col gap-2 rounded-ui border border-ligne p-3">
            <select name="motif" required defaultValue="" className="min-h-10 rounded-ui border border-ligne-forte bg-surface px-3">
              <option value="" disabled>
                Pourquoi ?
              </option>
              <option value="arnaque">Arnaque ou demande d&apos;argent</option>
              <option value="inapproprie">Contenu inapproprié</option>
              <option value="coordonnees">Coordonnées écrites dans l&apos;annonce</option>
              <option value="hors_sujet">Hors sujet</option>
              <option value="autre">Autre</option>
            </select>
            <textarea name="details" maxLength={300} rows={2} placeholder="Détails (facultatif)" className="rounded-ui border border-ligne-forte bg-surface px-3 py-2" />
            <Bouton variante="contour" className="self-start">
              Envoyer le signalement
            </Bouton>
          </form>
        </details>
      )}
    </article>
  );
}
