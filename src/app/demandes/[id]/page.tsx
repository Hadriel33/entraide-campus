import type { Metadata } from "next";
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
import type { Categorie } from "@/lib/annonces/validation";
import { graineDe, phrasesColette } from "@/lib/messages/brise-glace";
import { Conversation, type Message } from "./conversation";

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
      `id, statut, annonce:annonces(id, titre, type, categorie, auteur_id, auteur:profils!annonces_auteur_id_fkey(${PERSONNE})), demandeur:profils!demandes_contact_demandeur_id_fkey(${PERSONNE}), destinataire:profils!demandes_contact_destinataire_id_fkey(${PERSONNE})`,
    )
    .eq("id", id)
    .maybeSingle();
  const demande = data as unknown as {
    id: string;
    statut: string;
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
  const [{ data: messages }, { data: coordonnees }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, auteur_id, contenu, cree_le")
      .eq("demande_id", id)
      .order("cree_le")
      .limit(200),
    supabase
      .from("coordonnees")
      .select("telephone, email, reseau")
      .eq("id", autre.id)
      .maybeSingle<Coordonnees>(),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-5">
      <Link
        href="/demandes"
        className="text-sm text-encre-douce hover:text-encre"
      >
        Retour aux demandes
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
          C&apos;est fait : les autres intéressés sont prévenus, et ton annonce
          a quitté le tableau. Dis bonjour à {autre.prenom} !
        </p>
      )}
      <header className="apparition flex flex-wrap items-center gap-3">
        {enGroupe ? (
          <span className="flex shrink-0">
            {[...participants.values()].map((p, i) => (
              <span key={p.id} className={`rounded-full ring-2 ring-papier ${i ? "-ml-3" : ""}`}>
                <Avatar chemin={p.avatar_chemin} nom={p.pseudo} taille="lg" />
              </span>
            ))}
          </span>
        ) : (
          <Avatar chemin={autre.avatar_chemin} nom={autre.pseudo} taille="lg" />
        )}
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold">
            {enGroupe ? (
              <>
                Discussion de groupe
                <span className="rounded-full bg-bandeau px-2 py-0.5 text-xs font-bold">{participants.size} personnes</span>
              </>
            ) : (
              <>
                <Link href={`/profils/${autre.pseudo}`} className="hover:underline">
                  @{autre.pseudo}
                </Link>
                <BadgeCampus campus={autre.campus} />
              </>
            )}
          </h1>
          {demande.annonce && (
            <p className="truncate text-sm text-encre-douce">
              À propos de{" "}
              <Link
                href={`/annonces/${demande.annonce.id}`}
                className="underline-offset-2 hover:underline"
              >
                « {demande.annonce.titre} »
              </Link>
            </p>
          )}
        </div>
      </header>
      {dansLaPaire && (
        <details className="text-sm">
          <summary className="cursor-pointer text-encre-douce hover:text-encre">
            Voir les coordonnées de {autre.prenom}
          </summary>
          <div className="mt-2">
            <BlocCoordonnees c={coordonnees} prenom={autre.prenom} />
          </div>
        </details>
      )}
      <Conversation
        demandeId={id}
        moi={user.id}
        initiaux={(messages ?? []) as Message[]}
        prenomAutre={enGroupe ? "le groupe" : autre.prenom}
        noms={enGroupe ? Object.fromEntries([...participants.values()].map((p) => [p.id, p.pseudo])) : undefined}
        suggestions={
          demande.annonce
            ? phrasesColette({
                categorie: demande.annonce.categorie,
                // Sur un « je propose », l'auteur aide ; sur un « je cherche », c'est l'autre.
                jAide:
                  (demande.annonce.type === "propose") ===
                  (demande.annonce.auteur_id === user.id),
                prenom: autre.prenom,
                graine: graineDe(id),
              })
            : []
        }
      />
      <p className="text-xs text-encre-douce">
        {enGroupe
          ? `Visible seulement par ses participants : ${[...participants.values()].map((p) => "@" + p.pseudo).join(", ")}. Les coordonnées restent entre @${demande.demandeur.pseudo} et @${demande.destinataire.pseudo}.`
          : "Cette conversation n'est visible que par vous deux."}
      </p>
    </div>
  );
}
