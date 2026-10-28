import type { Metadata } from "next";
import Link from "next/link";
import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  SELECT_ANNONCE,
  dateCourte,
  type Annonce,
} from "@/lib/annonces/requetes";
import {
  CATEGORIES,
  CONTREPARTIES,
  QUARTIERS,
  TYPES,
} from "@/lib/annonces/validation";
import { joursRestants } from "@/lib/annonces/expiration";
import { BoutonFavori } from "@/components/annonces/bouton-favori";
import { BoutonPartager } from "@/components/annonces/bouton-partager";
import { inclinaison, teinte } from "@/lib/design/teintes";
import { Avatar } from "@/components/ui/avatar";
import { chargerSocial } from "@/lib/social/requetes";
import { Reactions } from "@/components/social/reactions";
import { BoutonSoutien } from "@/components/social/bouton-soutien";
import { Commentaires } from "@/components/social/commentaires";
import { Badge, BadgeCampus } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import {
  BlocCoordonnees,
  type Coordonnees,
} from "@/components/demandes/coordonnees";
import { FormulaireAvis } from "@/components/demandes/formulaire-avis";
import {
  annulerDemande,
  demanderContact,
  signalerAnnonce,
} from "@/app/demandes/actions";
import { appliquerCorrection, changerStatut, prolongerAnnonce, supprimerAnnonce } from "../actions";
import { Colette } from "@/components/colette/colette";
import { BadgeIA } from "@/components/ia/badge-ia";
import { EquipePostit } from "@/components/annonces/equipe-postit";
import { equipeAcceptee, libelleEquipe } from "@/lib/annonces/groupe";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function lireAnnonce(id: string) {
  if (!UUID.test(id)) return null;
  const { supabase } = await getSession();
  const { data } = await supabase
    .from("annonces")
    .select(SELECT_ANNONCE)
    .eq("id", id)
    .maybeSingle();
  return data as unknown as Annonce | null;
}

export async function generateMetadata({
  params,
}: PageProps<"/annonces/[id]">): Promise<Metadata> {
  const annonce = await lireAnnonce((await params).id);
  return { title: annonce?.titre ?? "Annonce introuvable" };
}

export default async function PageAnnonce({
  params,
}: PageProps<"/annonces/[id]">) {
  const { id } = await params;
  // La RLS ne renvoie rien si l'annonce n'est pas visible pour moi : même réponse qu'une annonce inexistante.
  const annonce = await lireAnnonce(id);
  if (!annonce) notFound();

  const { supabase, user } = await getSession();
  const estAuteur = user?.id === annonce.auteur_id;
  // Post-it de groupe : les membres qui ont accepté font partie de l'équipe (modifier, répondre, pas de demande à soi-même).
  const equipe = equipeAcceptee(annonce.membres);
  const estEquipe = estAuteur || (!!user && (annonce.membres ?? []).some((m) => m.membre_id === user.id && m.statut === "accepte"));
  const prenom = annonce.auteur?.prenom ?? "l'auteur";
  // Résultat de la modération IA, montré à l'auteur seulement.
  const { data: moderation } = estEquipe
    ? await supabase.from("annonces").select("moderation, moderation_raisons, moderation_suggestion").eq("id", annonce.id).maybeSingle()
    : { data: null };

  // Ma demande sur cette annonce (s'il y en a une), et ce qui en découle.
  const { data: demande } = estEquipe
    ? { data: null }
    : await supabase
        .from("demandes_contact")
        .select("id, statut, destinataire_id, destinataire:profils!demandes_contact_destinataire_id_fkey(prenom)")
        .eq("annonce_id", annonce.id)
        .eq("demandeur_id", user!.id)
        .maybeSingle();
  // Les coordonnées ne sont demandées QUE si la demande est acceptée ; sinon la RLS ne les renverrait de toute façon pas.
  const { data: coordonnees } =
    demande?.statut === "acceptee"
      ? await supabase
          .from("coordonnees")
          .select("telephone, email, reseau")
          .eq("id", demande.destinataire_id) // dans un groupe : celui qui a accepté, et lui seul
          .maybeSingle<Coordonnees>()
      : { data: null };
  const { data: favori } = estEquipe
    ? { data: null }
    : await supabase
        .from("favoris")
        .select("annonce_id")
        .eq("profil_id", user!.id)
        .eq("annonce_id", annonce.id)
        .maybeSingle();
  const jours = joursRestants(annonce.expire_le);
  const prenomContact = (demande?.destinataire as unknown as { prenom: string } | null)?.prenom ?? prenom;
  const { data: monAvis } =
    demande?.statut === "acceptee"
      ? await supabase
          .from("avis")
          .select("id")
          .eq("demande_id", demande.id)
          .eq("auteur_id", user!.id)
          .maybeSingle()
      : { data: null };

  // Le côté réseau social : réactions et commentaires sous l'annonce (jamais de coordonnées, la base y veille).
  const social = user ? await chargerSocial(supabase, "annonce", [annonce.id], user.id) : null;
  const { data: moi } = user ? await supabase.from("profils").select("role").eq("id", user.id).maybeSingle() : { data: null };

  return (
    <article className="apparition flex w-full max-w-2xl flex-col gap-8">
      <Link
        href="/annonces"
        className="text-sm text-encre-douce hover:text-encre"
      >
        Retour aux annonces
      </Link>
      {/* L'annonce en grand post-it, décollé du mur. */}
      <div
        className={`postit ${teinte(annonce.categorie).papier} flex flex-col gap-5 p-6 pt-8 sm:p-8 sm:pt-10`}
        style={
          {
            "--rot": `${inclinaison(annonce.id) / 3}deg`,
          } as React.CSSProperties
        }
      >
        <span className="scotch" aria-hidden />
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`titre-charte rounded-[3px] px-1.5 pt-0.5 text-base ${annonce.type === "cherche" ? "bg-encre text-surface" : "border-[1.5px] border-encre"}`}
          >
            {TYPES[annonce.type]}
          </span>
          <Badge point={teinte(annonce.categorie).point}>
            {CATEGORIES[annonce.categorie]}
          </Badge>
          {annonce.statut === "archivee" && <Badge>Archivée</Badge>}
          {annonce.statut === "masquee" && (
            <Badge>Masquée par la modération</Badge>
          )}
          {jours === 0 && annonce.statut === "publiee" && (
            <Badge variante="besoin">Expirée</Badge>
          )}
        </div>
        <ViewTransition
          name={`titre-${annonce.id}`}
          share="morph"
          default="none"
        >
          <h1 className="titre-charte text-titre text-balance">
            {annonce.titre}
          </h1>
        </ViewTransition>

        <Link
          href={`/profils/${annonce.auteur?.pseudo}`}
          className="presse relative flex items-center gap-3 self-start rounded-ui pr-3 hover:bg-surface/50"
        >
          <Avatar
            chemin={annonce.auteur?.avatar_chemin}
            nom={annonce.auteur?.pseudo ?? "?"}
            taille="lg"
          />
          <div>
            <p className="flex items-center gap-2 font-semibold">
              @{annonce.auteur?.pseudo}{" "}
              <BadgeCampus campus={annonce.auteur?.campus} />
            </p>
            <p className="text-sm text-encre-douce">
              {prenom} · publiée le {dateCourte(annonce.cree_le)}
            </p>
          </div>
        </Link>

        {equipe.length > 0 && (
          <p className="relative -mt-2 flex flex-wrap items-center gap-2 text-sm font-semibold">
            <span className="text-encre-douce">avec</span>
            {equipe.map((m) => (
              <Link key={m.pseudo} href={`/profils/${m.pseudo}`} className="presse flex items-center gap-1.5 rounded-full bg-surface/60 py-0.5 pr-2.5 pl-0.5 hover:bg-surface">
                <Avatar chemin={m.avatar_chemin} nom={m.pseudo} taille="sm" colette={m} />@{m.pseudo}
              </Link>
            ))}
          </p>
        )}

        <p className="font-serif text-lg leading-relaxed whitespace-pre-line">
          {annonce.description}
        </p>
        <p className="-rotate-2 self-end font-main text-2xl font-bold text-alerte">
          {CONTREPARTIES[annonce.contrepartie]}
        </p>
      </div>

      {/* La barre sociale tout de suite sous le post-it : soutenir, réagir. */}
      {social && user && (
        <div className="-mt-3 flex flex-wrap items-center gap-3">
          <BoutonSoutien grand annonceId={annonce.id} resume={social.soutiens.get(annonce.id) ?? { n: 0, moi: false }} proprietaire={estEquipe} />
          <Reactions cible="annonce" id={annonce.id} resume={social.reactions.get(annonce.id)!} proprietaire={estEquipe} />
        </div>
      )}


      {/* IA n°2 : ce que Colette a remarqué, et sa proposition de correction (l'auteur décide). */}
      {estEquipe && moderation?.moderation_suggestion && (
        <section className="flex flex-col gap-4 rounded-carte border border-encre bg-surface p-5 shadow-[4px_4px_0_0_var(--color-lilas)]" aria-labelledby="correction">
          <div className="flex items-center gap-3">
            <Colette anim="reflechit" taille={70} className="shrink-0" />
            <div>
              <BadgeIA numero={2} />
              <h2 id="correction" className="font-main text-2xl leading-tight">
                Colette te propose une version corrigée
              </h2>
              {moderation.moderation_raisons.length > 0 && <p className="text-sm text-encre-douce">{moderation.moderation_raisons.join(" ")}</p>}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 rounded-ui bg-papier-fonce p-3 text-sm">
              <span className="text-xs font-semibold text-encre-douce">Ton texte</span>
              <strong>{annonce.titre}</strong>
              <p className="whitespace-pre-line text-encre-douce line-through decoration-alerte/60">{annonce.description}</p>
            </div>
            <div className="postit papier-jaune flex flex-col gap-1 p-3 pt-4 text-sm" style={{ "--rot": "0.8deg" } as React.CSSProperties}>
              <span className="text-xs font-semibold">La proposition de Colette</span>
              <strong>{moderation.moderation_suggestion.titre}</strong>
              <p className="whitespace-pre-line">{moderation.moderation_suggestion.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={appliquerCorrection.bind(null, annonce.id)}>
              <Bouton>Appliquer la correction</Bouton>
            </form>
            <BoutonLien href={`/annonces/${annonce.id}/modifier`} variante="contour">
              Corriger moi-même
            </BoutonLien>
          </div>
          <p className="text-xs text-encre-douce">
            En attendant, ton annonce est cachée aux autres étudiants (seuls toi et l&apos;admin la voyez). Rien ne change sans ton accord, et un modérateur
            humain garde le dernier mot.
          </p>
        </section>
      )}

      {estEquipe && !moderation?.moderation_suggestion && moderation?.moderation === "a_verifier" && annonce.statut !== "masquee" && (
        <div role="status" className="flex items-center gap-4 rounded-carte bg-postit-lilas p-4 text-sm">
          <Colette anim="reflechit" taille={70} className="shrink-0" />
          <p>
            <BadgeIA numero={2} className="mb-1" />
            <strong className="block font-main text-xl">Colette a un petit doute</strong>
            {moderation.moderation_raisons.join(" ") || "Un modérateur va jeter un œil."} En attendant, seuls toi et l&apos;admin la voyez.
          </p>
        </div>
      )}

      {estEquipe && annonce.statut === "masquee" && (
        <div role="status" className="flex items-center gap-4 rounded-carte bg-postit-lilas p-4 text-sm">
          <Colette anim="tampon" taille={80} className="shrink-0" />
          <p>
            <strong className="block font-main text-xl">Colette relit ton annonce</strong>
            Elle n&apos;est pas visible des autres étudiants pour le moment. Un modérateur va la relire rapidement.
          </p>
        </div>
      )}

      {user && <EquipePostit annonce={annonce} moi={user.id} estAuteur={estAuteur} />}

      {estEquipe ? (
        <div className="flex flex-wrap gap-3 border-t border-ligne pt-6">
          <BoutonLien href={`/annonces/${annonce.id}/modifier`}>
            Modifier
          </BoutonLien>
          {estAuteur && annonce.statut !== "masquee" && (
            <form
              action={changerStatut.bind(
                null,
                annonce.id,
                annonce.statut === "publiee" ? "archivee" : "publiee",
              )}
            >
              <Bouton variante="contour">
                {annonce.statut === "publiee" ? "Archiver" : "Republier"}
              </Bouton>
            </form>
          )}
          {estAuteur && (
            <form action={supprimerAnnonce.bind(null, annonce.id)}>
              <Bouton variante="danger">Supprimer</Bouton>
            </form>
          )}
        </div>
      ) : (
        <section
          className="flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-4"
          aria-labelledby="titre-contact"
        >
          <h2 id="titre-contact" className="font-semibold">
            Contacter {equipe.length ? libelleEquipe(annonce.auteur?.pseudo ?? "", equipe.map((m) => m.pseudo)) : prenom}
          </h2>

          {!demande && (
            <form
              action={demanderContact.bind(null, annonce.id)}
              className="flex flex-col gap-3"
            >
              <p className="text-sm text-encre-douce">
                Ses coordonnées restent cachées. Si {prenom} accepte ta demande,
                vous verrez chacun les coordonnées de l&apos;autre.
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
              <Badge>Refusée</Badge> {prenom} a décliné ta demande. Pas de
              souci, d&apos;autres annonces t&apos;attendent.
            </p>
          )}

          {demande?.statut === "acceptee" && (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-sm">
                <Badge variante="ok">Acceptée</Badge> Tu peux contacter {prenomContact}{" "}
                :
              </p>
              <BlocCoordonnees c={coordonnees} prenom={prenomContact} />
              <BoutonLien
                href={`/demandes/${demande.id}`}
                className="self-start"
              >
                {equipe.length ? "Discuter avec le groupe" : `Discuter avec ${prenomContact}`}
              </BoutonLien>
              {!monAvis && (
                <FormulaireAvis
                  demandeId={demande.id}
                  retour={`/annonces/${annonce.id}`}
                  prenom={prenom}
                />
              )}
            </div>
          )}
        </section>
      )}

      <dl className="divide-y divide-ligne rounded-carte border border-ligne bg-surface text-sm">
        <div className="flex justify-between gap-4 px-4 py-3">
          <dt className="text-encre-douce">Contrepartie</dt>
          <dd className="font-medium">{CONTREPARTIES[annonce.contrepartie]}</dd>
        </div>
        {annonce.quartier && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-encre-douce">Quartier</dt>
            <dd className="font-medium">{QUARTIERS[annonce.quartier]}</dd>
          </div>
        )}
        {annonce.tram && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-encre-douce">Tram</dt>
            <dd>
              <span className="rounded-ui bg-encre px-2 py-0.5 text-sm font-semibold text-surface">
                Ligne {annonce.tram}
              </span>
            </dd>
          </div>
        )}
        {annonce.lieu && (
          <div className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-encre-douce">Lieu</dt>
            <dd className="font-medium">{annonce.lieu}</dd>
          </div>
        )}
        {estEquipe && annonce.statut === "publiee" && (
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <dt className="text-encre-douce">Visibilité</dt>
            <dd className="flex items-center gap-3 font-medium">
              {jours === 0
                ? "Expirée, invisible dans la liste"
                : `Encore ${jours} jour${jours > 1 ? "s" : ""}`}
              {estAuteur && jours <= 7 && (
                <form action={prolongerAnnonce.bind(null, annonce.id)}>
                  <Bouton variante="contour" className="min-h-8 px-2.5 text-sm">
                    Prolonger
                  </Bouton>
                </form>
              )}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex flex-wrap gap-2">
        {!estEquipe && (
          <BoutonFavori annonceId={annonce.id} favori={!!favori} />
        )}
        <BoutonPartager titre={annonce.titre} />
      </div>

      {!estEquipe && (
        <details className="text-sm">
          <summary className="cursor-pointer text-encre-douce hover:text-encre">
            Signaler cette annonce
          </summary>
          <form
            action={signalerAnnonce.bind(null, annonce.id)}
            className="mt-3 flex flex-col gap-2 rounded-ui border border-ligne p-3"
          >
            <select
              name="motif"
              required
              defaultValue=""
              className="min-h-10 rounded-ui border border-ligne-forte bg-surface px-3"
            >
              <option value="" disabled>
                Pourquoi ?
              </option>
              <option value="arnaque">Arnaque ou demande d&apos;argent</option>
              <option value="inapproprie">Contenu inapproprié</option>
              <option value="coordonnees">
                Coordonnées écrites dans l&apos;annonce
              </option>
              <option value="hors_sujet">Hors sujet</option>
              <option value="autre">Autre</option>
            </select>
            <textarea
              name="details"
              maxLength={300}
              rows={2}
              placeholder="Détails (facultatif)"
              className="rounded-ui border border-ligne-forte bg-surface px-3 py-2"
            />
            <Bouton variante="contour" className="self-start">
              Envoyer le signalement
            </Bouton>
          </form>
        </details>
      )}
      {social && user && (
        <section id="commentaires" className="flex scroll-mt-6 flex-col gap-3 border-t border-ligne pt-6">
          <h2 className="titre-charte text-section">Commentaires</h2>
          <Commentaires
            cible="annonce"
            id={annonce.id}
            liste={social.commentaires.get(annonce.id) ?? []}
            moi={user.id}
            estAdmin={moi?.role === "admin"}
            ouvert
          />
        </section>
      )}
    </article>
  );
}
