import type { Metadata } from "next";
import { SuiviColette } from "@/components/echanges/suivi-colette";
import { jeSuisAide, type Etape } from "@/lib/echanges/suivi";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { Avatar } from "@/components/ui/avatar";
import { BadgeCampus } from "@/components/ui/badge";
import {
  BlocCoordonnees,
  type Coordonnees,
} from "@/components/demandes/coordonnees";
import { Colette } from "@/components/colette/colette";
import { CATEGORIES, TYPES, type Categorie } from "@/lib/annonces/validation";
import { Conversation, type Message } from "./conversation";
import { SELECT_MINI } from "@/components/annonces/mini-postit";

export const metadata: Metadata = { title: "Conversation" };

type Personne = {
  id: string;
  prenom: string;
  pseudo: string;
  campus: string;
  avatar_chemin: string | null;
};
const PERSONNE = "id, prenom, pseudo, campus, avatar_chemin";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PageConversation({
  params,
  searchParams,
}: PageProps<"/demandes/[id]">) {
  const { id } = await params;
  const { ok } = await searchParams;
  if (!UUID.test(id)) notFound();
  const { supabase, user } = await exigerSession();

  // La RLS ne renvoie la demande qu'à ses deux participants : un tiers obtient une 404.
  const { data } = await supabase
    .from("demandes_contact")
    .select(
      `id, statut, message, cree_le, repondu_le, annonce:annonces(id, titre, type, categorie, auteur_id, auteur:profils!annonces_auteur_id_fkey(${PERSONNE})), demandeur:profils!demandes_contact_demandeur_id_fkey(${PERSONNE}), destinataire:profils!demandes_contact_destinataire_id_fkey(${PERSONNE})`,
    )
    .eq("id", id)
    .maybeSingle();
  const demande = data as unknown as {
    id: string;
    statut: string;
    message: string | null;
    cree_le: string;
    repondu_le: string | null;
    annonce: {
      id: string;
      titre: string;
      type: string;
      categorie: Categorie;
      auteur_id: string;
      auteur: Personne | null;
    } | null;
    demandeur: Personne;
    destinataire: Personne;
  } | null;
  if (!demande || demande.statut !== "acceptee") notFound();

  // Post-it de groupe : la discussion réunit le demandeur, celui qui a accepté et toute l'équipe (règle d'or n°3 : ses participants).
  const { data: membres } = demande.annonce
    ? await supabase
        .from("annonce_membres")
        .select(`membre:profils!annonce_membres_membre_id_fkey(${PERSONNE})`)
        .eq("annonce_id", demande.annonce.id)
        .eq("statut", "accepte")
    : { data: [] };
  const participants = new Map<string, Personne>();
  for (const p of [
    demande.demandeur,
    demande.destinataire,
    demande.annonce?.auteur ?? null,
    ...((membres ?? []) as unknown as { membre: Personne | null }[]).map((m) => m.membre),
  ])
    if (p) participants.set(p.id, p);
  const enGroupe = participants.size > 2;
  // Les coordonnées ne s'échangent qu'entre le demandeur et celui qui a accepté (règle d'or n°1).
  const dansLaPaire = user.id === demande.demandeur.id || user.id === demande.destinataire.id;
  const autre =
    demande.demandeur.id === user.id ? demande.destinataire : demande.demandeur;
  const [{ data: messages }, { data: coordonnees }, { data: suivi }] = await Promise.all([
    supabase
      .from("messages")
      .select(`id, auteur_id, contenu, cree_le, ${SELECT_MINI}`)
      .eq("demande_id", id)
      .order("cree_le")
      .limit(200),
    supabase
      .from("coordonnees")
      .select("telephone, email, reseau")
      .eq("id", autre.id)
      .maybeSingle<Coordonnees>(),
    supabase.from("suivis_entraide").select("etape, mot, maj_le").eq("demande_id", id).maybeSingle<{ etape: Etape; mot: string | null; maj_le: string }>(),
  ]);
  const aide = demande.annonce ? jeSuisAide({ type: demande.annonce.type as "propose" | "cherche", demandeurId: demande.demandeur.id, moi: user.id }) : false;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
      <Link href="/demandes" className="group/retour inline-flex w-fit items-center gap-1.5 text-sm font-semibold underline decoration-2 underline-offset-4 hover:decoration-bandeau">
        <span aria-hidden className="transition-transform group-hover/retour:-translate-x-1">←</span>
        Retour à mes échanges
      </Link>
      {ok === "choisi" && (
        <p
          role="status"
          className="pop flex items-center gap-3 rounded-carte border border-encre bg-offre px-4 py-3 text-sm"
        >
          <Colette
            anim="tampon"
            taille={48}
            saison={false}
            className="shrink-0"
          />
          C&apos;est fait : les autres intéressés sont prévenus, et ton post-it
          a quitté le tableau. Dis bonjour à {autre.prenom} !
        </p>
      )}
      {/* Le sujet d'abord : le post-it dont on parle, en grand ; puis avec qui. */}
      <header className="apparition flex flex-col gap-3">
        {demande.annonce && (
          <Link href={`/annonces/${demande.annonce.id}`} className="group flex flex-col gap-1 self-start">
            <span className="flex flex-wrap items-center gap-2 text-xs font-bold tracking-wide uppercase">
              <span className="titre-charte rounded-[3px] bg-encre px-1.5 pt-0.5 text-sm text-surface">{TYPES[demande.annonce.type as keyof typeof TYPES]}</span>
              {CATEGORIES[demande.annonce.categorie]}
            </span>
            <span className="titre-charte text-titre text-balance decoration-4 underline-offset-4 group-hover:underline">{demande.annonce.titre}</span>
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {enGroupe ? (
            <span className="flex shrink-0">
              {[...participants.values()].map((p, i) => (
                <span key={p.id} className={`rounded-full ring-2 ring-papier ${i ? "-ml-3" : ""}`}>
                  <Avatar chemin={p.avatar_chemin} nom={p.pseudo} />
                </span>
              ))}
            </span>
          ) : (
            <Avatar chemin={autre.avatar_chemin} nom={autre.pseudo} />
          )}
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            {enGroupe ? (
              <>
                Discussion de groupe
                <span className="rounded-full bg-bandeau px-2 py-0.5 text-xs font-bold">{participants.size} personnes</span>
              </>
            ) : (
              <>
                avec{" "}
                <Link href={`/profils/${autre.pseudo}`} className="underline-offset-2 hover:underline">
                  @{autre.pseudo}
                </Link>
                <BadgeCampus campus={autre.campus} />
              </>
            )}
          </p>
        </div>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <Conversation
            demandeId={id}
            moi={user.id}
            initiaux={(messages ?? []) as unknown as Message[]}
            prenomAutre={enGroupe ? "le groupe" : autre.prenom}
            noms={enGroupe ? Object.fromEntries([...participants.values()].map((p) => [p.id, p.pseudo])) : undefined}
            debut={{
              demandeur: demande.demandeur.pseudo,
              message: demande.message,
              demandeLe: demande.cree_le,
              accepteur: demande.destinataire.pseudo,
              accepteLe: demande.repondu_le,
            }}
          />
          <p className="text-xs text-encre-douce">
            {enGroupe
              ? `Visible seulement par ses participants : ${[...participants.values()].map((p) => "@" + p.pseudo).join(", ")}. Les coordonnées restent entre @${demande.demandeur.pseudo} et @${demande.destinataire.pseudo}.`
              : "Cette conversation n'est visible que par vous deux."}
          </p>
        </div>
        {/* Sur le côté : le suivi de l'entraide et les coordonnées. */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-6">
          {demande.annonce && (
            <SuiviColette
              demandeId={id}
              etape={suivi?.etape ?? null}
              mot={suivi?.mot ?? null}
              majLe={suivi?.maj_le ?? null}
              aide={aide}
              prenomAutre={enGroupe ? "le groupe" : autre.prenom}
              retour="discussion"
              lienAvis={`/demandes${user.id === demande.demandeur.id ? "?onglet=envoyees" : ""}#demande-${id}`}
            />
          )}
          {dansLaPaire && (
            <details className="rounded-carte border border-ligne bg-surface p-4 text-sm">
              <summary className="cursor-pointer font-semibold">Coordonnées de {autre.prenom}</summary>
              <div className="mt-2">
                <BlocCoordonnees c={coordonnees} prenom={autre.prenom} />
              </div>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
