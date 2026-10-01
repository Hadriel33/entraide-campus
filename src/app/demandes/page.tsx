import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { dateCourte } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { BlocCoordonnees, type Coordonnees } from "@/components/demandes/coordonnees";
import { FormulaireAvis } from "@/components/demandes/formulaire-avis";
import { repondreDemande } from "./actions";

export const metadata: Metadata = { title: "Demandes" };

type Personne = { id: string; prenom: string; pseudo: string; ecole: string; avatar_chemin: string | null };
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

export default async function PageDemandes({ searchParams }: PageProps<"/demandes">) {
  const { supabase, user } = await exigerSession();
  const onglet = (await searchParams).onglet === "envoyees" ? "envoyees" : "recues";

  const colonne = onglet === "recues" ? "destinataire_id" : "demandeur_id";
  const { data } = await supabase.from("demandes_contact").select(SELECT).eq(colonne, user.id).order("cree_le", { ascending: false });
  const demandes = (data ?? []) as unknown as Demande[];

  // Coordonnées des personnes avec qui l'accord existe (la RLS ne renvoie que celles-là).
  const autres = demandes.filter((d) => d.statut === "acceptee").map((d) => (onglet === "recues" ? d.demandeur?.id : d.destinataire?.id)).filter(Boolean) as string[];
  const { data: coords } = autres.length
    ? await supabase.from("coordonnees").select("id, telephone, email, reseau").in("id", autres)
    : { data: [] };
  const coordonneesDe = new Map((coords ?? []).map((c) => [c.id, c as Coordonnees]));

  const acceptees = demandes.filter((d) => d.statut === "acceptee").map((d) => d.id);
  const { data: mesAvis } = acceptees.length
    ? await supabase.from("avis").select("demande_id").eq("auteur_id", user.id).in("demande_id", acceptees)
    : { data: [] };
  const avisDonnes = new Set((mesAvis ?? []).map((a) => a.demande_id));

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <TitrePage accroche="Accepte une demande pour échanger vos coordonnées. Tant que tu n'as pas accepté, les tiennes restent cachées.">
        Demandes
      </TitrePage>

      <nav className="inline-flex self-start rounded-ui bg-papier-fonce p-1" aria-label="Type de demandes">
        {[
          { valeur: "recues", label: "Reçues", href: "/demandes" },
          { valeur: "envoyees", label: "Envoyées", href: "/demandes?onglet=envoyees" },
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
        <div className="flex flex-col gap-2 rounded-carte border border-dashed border-ligne-forte p-6">
          <strong>{onglet === "recues" ? "Aucune demande reçue pour l'instant" : "Tu n'as envoyé aucune demande"}</strong>
          <p className="text-sm text-encre-douce">
            {onglet === "recues"
              ? "Quand quelqu'un voudra te contacter pour une de tes annonces, sa demande apparaîtra ici."
              : "Trouve une annonce qui t'intéresse et clique sur « Demander le contact »."}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {demandes.map((d, i) => {
          const autre = onglet === "recues" ? d.demandeur : d.destinataire;
          if (!autre) return null;
          return (
            <li
              key={d.id}
              className="apparition flex flex-col gap-3 rounded-carte border border-ligne bg-surface p-4"
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/profils/${autre.pseudo}`} className="flex items-center gap-2.5 font-semibold hover:underline">
                  <Avatar chemin={autre.avatar_chemin} nom={autre.pseudo} />
                  @{autre.pseudo}
                  <BadgeEcole ecole={autre.ecole} />
                </Link>
                <span className="flex items-center gap-2 text-xs text-encre-douce">
                  {dateCourte(d.cree_le)} {STATUTS[d.statut]}
                </span>
              </div>
              {d.annonce && (
                <p className="text-sm">
                  Pour{" "}
                  <Link href={`/annonces/${d.annonce.id}`} className="font-medium underline-offset-2 hover:underline">
                    « {d.annonce.titre} »
                  </Link>
                </p>
              )}
              {d.message && <p className="rounded-ui bg-papier-fonce px-3 py-2 font-serif text-sm">{d.message}</p>}

              {onglet === "recues" && d.statut === "en_attente" && (
                <div className="flex gap-2">
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
                  <BlocCoordonnees c={coordonneesDe.get(autre.id) ?? null} prenom={autre.prenom} />
                  <BoutonLien href={`/demandes/${d.id}`} className="self-start">
                    Discuter avec {autre.prenom}
                  </BoutonLien>
                  {!avisDonnes.has(d.id) && <FormulaireAvis demandeId={d.id} retour="/demandes" prenom={autre.prenom} />}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
