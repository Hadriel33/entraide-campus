import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { dateCourte } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import {
  BlocCoordonnees,
  type Coordonnees,
} from "@/components/demandes/coordonnees";
import { FormulaireAvis } from "@/components/demandes/formulaire-avis";
import { repondreDemande } from "./actions";
import { inclinaison } from "@/lib/design/teintes";

export const metadata: Metadata = { title: "Demandes" };

type Personne = {
  id: string;
  prenom: string;
  pseudo: string;
  ecole: string;
  avatar_chemin: string | null;
};
type Demande = {
  id: string;
  statut: "en_attente" | "acceptee" | "refusee";
  message: string | null;
  cree_le: string;
  annonce: { id: string; titre: string } | null;
  demandeur: Personne | null;
  destinataire: Personne | null;
};

const PERSONNE = "id, prenom, pseudo, ecole, avatar_chemin";
const SELECT = `id, statut, message, cree_le, annonce:annonces(id, titre), demandeur:profils!demandes_contact_demandeur_id_fkey(${PERSONNE}), destinataire:profils!demandes_contact_destinataire_id_fkey(${PERSONNE})`;

const STATUTS = {
  en_attente: <Badge>En attente</Badge>,
  acceptee: <Badge variante="ok">Acceptée</Badge>,
  refusee: <Badge>Refusée</Badge>,
};

// Tableau de post-it punaisés : une colonne par étape, une couleur de papier par statut.
const COLONNES = {
  recues: [
    {
      statut: "en_attente",
      titre: "À traiter",
      note: "ils attendent ta réponse",
      papier: "papier-jaune",
    },
    {
      statut: "acceptee",
      titre: "En contact",
      note: "la discussion est ouverte",
      papier: "papier-ciel",
    },
  ],
  envoyees: [
    {
      statut: "en_attente",
      titre: "En attente",
      note: "la réponse arrive",
      papier: "papier-jaune",
    },
    {
      statut: "acceptee",
      titre: "En contact",
      note: "à toi de jouer",
      papier: "papier-ciel",
    },
  ],
} as const;

export default async function PageDemandes({
  searchParams,
}: PageProps<"/demandes">) {
  const { supabase, user } = await exigerSession();
  const onglet =
    (await searchParams).onglet === "envoyees" ? "envoyees" : "recues";

  const colonne = onglet === "recues" ? "destinataire_id" : "demandeur_id";
  const { data } = await supabase
    .from("demandes_contact")
    .select(SELECT)
    .eq(colonne, user.id)
    .order("cree_le", { ascending: false });
  const demandes = (data ?? []) as unknown as Demande[];

  // Coordonnées des personnes avec qui l'accord existe (la RLS ne renvoie que celles-là).
  const autres = demandes
    .filter((d) => d.statut === "acceptee")
    .map((d) => (onglet === "recues" ? d.demandeur?.id : d.destinataire?.id))
    .filter(Boolean) as string[];
  const { data: coords } = autres.length
    ? await supabase
        .from("coordonnees")
        .select("id, telephone, email, reseau")
        .in("id", autres)
    : { data: [] };
  const coordonneesDe = new Map(
    (coords ?? []).map((c) => [c.id, c as Coordonnees]),
  );

  const acceptees = demandes
    .filter((d) => d.statut === "acceptee")
    .map((d) => d.id);
  const { data: mesAvis } = acceptees.length
    ? await supabase
        .from("avis")
        .select("demande_id")
        .eq("auteur_id", user.id)
        .in("demande_id", acceptees)
    : { data: [] };
  const avisDonnes = new Set((mesAvis ?? []).map((a) => a.demande_id));

  function carte(d: Demande, i: number, papier: string) {
    const autre = onglet === "recues" ? d.demandeur : d.destinataire;
    if (!autre) return null;
    return (
      <article
        key={d.id}
        className={`colle postit ${papier} flex flex-col gap-3 p-5 pt-6`}
        style={
          {
            "--i": i,
            "--rot": `${inclinaison(d.id) * 0.6}deg`,
          } as React.CSSProperties
        }
      >
        <span className="punaise" aria-hidden />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link
            href={`/profils/${autre.pseudo}`}
            className="relative flex items-center gap-2.5 font-bold hover:underline"
          >
            <Avatar chemin={autre.avatar_chemin} nom={autre.pseudo} />@
            {autre.pseudo}
            <BadgeEcole ecole={autre.ecole} />
          </Link>
          <span className="flex items-center gap-2 text-xs text-encre/60">
            {dateCourte(d.cree_le)} {d.statut === "refusee" && STATUTS.refusee}
          </span>
        </div>
        {d.annonce && (
          <p className="text-sm">
            Pour{" "}
            <Link
              href={`/annonces/${d.annonce.id}`}
              className="font-semibold underline decoration-encre/30 underline-offset-2 hover:decoration-encre"
            >
              {d.annonce.titre}
            </Link>
          </p>
        )}
        {d.message && (
          <p className="font-main text-xl leading-snug">« {d.message} »</p>
        )}

        {onglet === "recues" && d.statut === "en_attente" && (
          <div className="flex gap-2 pt-1">
            <form action={repondreDemande.bind(null, d.id, "acceptee")}>
              <Bouton>Accepter</Bouton>
            </form>
            <form action={repondreDemande.bind(null, d.id, "refusee")}>
              <Bouton variante="contour">Refuser</Bouton>
            </form>
          </div>
        )}

        {d.statut === "acceptee" && (
          <>
            <BlocCoordonnees
              c={coordonneesDe.get(autre.id) ?? null}
              prenom={autre.prenom}
            />
            <BoutonLien href={`/demandes/${d.id}`} className="self-start">
              Discuter avec {autre.prenom}
            </BoutonLien>
            {!avisDonnes.has(d.id) && (
              <FormulaireAvis
                demandeId={d.id}
                retour="/demandes"
                prenom={autre.prenom}
              />
            )}
          </>
        )}
      </article>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <TitrePage accroche="Accepte une demande pour échanger vos coordonnées. Tant que tu n'as pas accepté, les tiennes restent cachées.">
        Demandes
      </TitrePage>

      <nav
        className="inline-flex self-start rounded-ui bg-papier-fonce p-1"
        aria-label="Type de demandes"
      >
        {[
          { valeur: "recues", label: "Reçues", href: "/demandes" },
          {
            valeur: "envoyees",
            label: "Envoyées",
            href: "/demandes?onglet=envoyees",
          },
        ].map((o) => (
          <Link
            key={o.valeur}
            href={o.href}
            aria-current={onglet === o.valeur ? "page" : undefined}
            className="rounded-[4px] px-3.5 py-1.5 text-sm font-medium text-encre-douce aria-[current=page]:bg-surface aria-[current=page]:text-encre aria-[current=page]:shadow-sm"
          >
            {o.label}
          </Link>
        ))}
      </nav>

      {demandes.length === 0 && (
        <div
          className="postit papier-gris flex max-w-md flex-col gap-2 self-center p-6 pt-7"
          style={{ "--rot": "1.5deg" } as React.CSSProperties}
        >
          <span className="punaise" aria-hidden />
          <strong className="font-main text-2xl">
            {onglet === "recues"
              ? "Aucune demande reçue pour l'instant"
              : "Tu n'as envoyé aucune demande"}
          </strong>
          <p className="text-sm text-encre/75">
            {onglet === "recues"
              ? "Quand quelqu'un voudra te contacter pour une de tes annonces, sa demande sera punaisée ici."
              : "Trouve une annonce qui t'intéresse et clique sur « Demander le contact »."}
          </p>
        </div>
      )}

      {demandes.length > 0 && (
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {COLONNES[onglet].map((col) => {
            const liste = demandes.filter((d) => d.statut === col.statut);
            return (
              <section
                key={col.statut}
                className="flex flex-col gap-7"
                aria-label={col.titre}
              >
                <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-encre pb-2">
                  <span className="titre-charte text-section whitespace-nowrap">{col.titre}</span>
                  <span className="titre-charte rounded-[3px] bg-encre px-1.5 pt-0.5 text-sm text-surface">
                    {liste.length}
                  </span>
                  <span className="ml-auto -rotate-2 font-main text-lg text-encre-douce">
                    {col.note}
                  </span>
                </h2>
                {liste.length === 0 && (
                  <p className="font-main text-lg text-encre-douce">
                    Rien pour l&apos;instant.
                  </p>
                )}
                {liste.map((d, i) => carte(d, i, col.papier))}
              </section>
            );
          })}
        </div>
      )}

      {demandes.some((d) => d.statut === "refusee") && (
        <details className="group/refus">
          <summary className="w-fit cursor-pointer list-none text-sm font-semibold text-encre-douce hover:text-encre [&::-webkit-details-marker]:hidden">
            Voir les demandes refusées (
            {demandes.filter((d) => d.statut === "refusee").length})
          </summary>
          <div className="mt-8 grid gap-8 opacity-75 sm:grid-cols-2 lg:grid-cols-3">
            {demandes
              .filter((d) => d.statut === "refusee")
              .map((d, i) => carte(d, i, "papier-gris"))}
          </div>
        </details>
      )}
    </div>
  );
}
