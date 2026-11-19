import type { Metadata } from "next";
import Link from "next/link";
import { exigerSession } from "@/lib/session";
import { dateCourte } from "@/lib/annonces/requetes";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeCampus } from "@/components/ui/badge";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import {
  BlocCoordonnees,
  type Coordonnees,
} from "@/components/demandes/coordonnees";
import { FormulaireAvis } from "@/components/demandes/formulaire-avis";
import { choisirDemande, repondreDemande } from "./actions";
import { grouperParAnnonce, resumeCandidat } from "@/lib/demandes/choix";
import type { Stats } from "@/lib/gamification/progression";
import { inclinaison } from "@/lib/design/teintes";
import { EtatVide } from "@/components/colette/etat-vide";
import { SuiviColette } from "@/components/echanges/suivi-colette";
import { colonneEchange, etapesDatees, jeSuisAide, type Etape } from "@/lib/echanges/suivi";
import { jourCampus } from "@/lib/temps";

export const metadata: Metadata = { title: "Mes échanges" };

type Personne = {
  id: string;
  prenom: string;
  pseudo: string;
  campus: string;
  avatar_chemin: string | null;
};
type Demande = {
  id: string;
  statut: "en_attente" | "acceptee" | "refusee";
  message: string | null;
  cree_le: string;
  repondu_le: string | null;
  annonce: { id: string; titre: string; type: "propose" | "cherche" } | null;
  demandeur: Personne | null;
  destinataire: Personne | null;
};

const PERSONNE = "id, prenom, pseudo, campus, avatar_chemin";
const SELECT = `id, statut, message, cree_le, repondu_le, annonce:annonces(id, titre, type), demandeur:profils!demandes_contact_demandeur_id_fkey(${PERSONNE}), destinataire:profils!demandes_contact_destinataire_id_fkey(${PERSONNE})`;

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
      titre: "En cours",
      note: "Colette suit l'entraide",
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
      titre: "En cours",
      note: "Colette suit l'entraide",
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

  // Reçues : celles qui me sont adressées, et celles des post-its de groupe dont je fais partie (créateur ou membre).
  const { data: mesGroupes } =
    onglet === "recues"
      ? await supabase.from("annonce_membres").select("annonce_id").eq("membre_id", user.id).eq("statut", "accepte")
      : { data: [] };
  const { data: mesCreations } =
    onglet === "recues"
      ? await supabase.from("annonce_membres").select("annonce_id, annonce:annonces!inner(auteur_id)").eq("annonce.auteur_id", user.id).eq("statut", "accepte")
      : { data: [] };
  const equipes = [...new Set([...(mesGroupes ?? []), ...(mesCreations ?? [])].map((g) => g.annonce_id))];
  let requete = supabase.from("demandes_contact").select(SELECT).order("cree_le", { ascending: false });
  requete =
    onglet === "envoyees"
      ? requete.eq("demandeur_id", user.id)
      : equipes.length
        ? requete.or(`destinataire_id.eq.${user.id},annonce_id.in.(${equipes.join(",")})`).neq("demandeur_id", user.id)
        : requete.eq("destinataire_id", user.id);
  const { data } = await requete;
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
  // Le suivi de chaque échange accepté (0034) : Colette livreuse, puis « Bien reçu ».
  const { data: suivis } = acceptees.length
    ? await supabase.from("suivis_entraide").select("demande_id, etape, mot, maj_le").in("demande_id", acceptees)
    : { data: [] };
  const suiviDe = new Map((suivis ?? []).map((x) => [x.demande_id as string, { etape: x.etape as Etape, mot: x.mot as string | null, maj_le: x.maj_le as string }]));
  const colonne = (d: Demande) => colonneEchange({ statut: d.statut, etape: suiviDe.get(d.id)?.etape ?? null });
  // L'historique : les échanges terminés (« Bien reçu ») et les refusés, du plus récent au plus ancien.
  const dateFin = (d: Demande) => (colonne(d) === "termine" ? suiviDe.get(d.id)?.maj_le : d.repondu_le) ?? d.cree_le;
  const historique = demandes
    .filter((d) => colonne(d) === "termine" || d.statut === "refusee")
    .sort((a, b) => dateFin(b).localeCompare(dateFin(a)));

  // Plusieurs intéressés sur une même annonce : on les regroupe pour comparer (des faits, jamais de coordonnées).
  const { groupes, seules } = grouperParAnnonce(
    onglet === "recues"
      ? demandes.filter((d) => d.statut === "en_attente")
      : [],
  );
  const candidats = groupes
    .flatMap((g) => g.demandes.map((d) => d.demandeur?.id))
    .filter(Boolean) as string[];
  const statsCandidats = new Map(
    await Promise.all(
      candidats.map(async (id) => {
        const { data: st } = await supabase.rpc("stats_profil", { cible: id });
        return [id, resumeCandidat((st as Stats | null) ?? null)] as const;
      }),
    ),
  );

  function groupe(g: (typeof groupes)[number], i: number) {
    return (
      <article
        key={g.annonce.id}
        className="colle postit papier-jaune flex flex-col gap-4 p-5 pt-6"
        style={{ "--i": i, "--rot": "-0.5deg" } as React.CSSProperties}
      >
        <span className="punaise" aria-hidden />
        <div className="flex flex-col gap-1">
          <span className="titre-charte text-sm">
            {g.demandes.length} personnes intéressées
          </span>
          <Link
            href={`/annonces/${g.annonce.id}`}
            className="text-lg leading-snug font-bold hover:underline"
          >
            « {g.annonce.titre} »
          </Link>
          <p className="-rotate-1 font-main text-lg text-alerte">
            à toi de choisir, pas de premier arrivé premier servi
          </p>
        </div>
        <ul className="flex flex-col gap-3">
          {g.demandes.map((d) => {
            const p = d.demandeur;
            if (!p) return null;
            const r = statsCandidats.get(p.id) ?? resumeCandidat(null);
            return (
              <li
                key={d.id}
                id={`demande-${d.id}`}
                className="flex scroll-mt-24 flex-col gap-2.5 rounded-carte bg-surface/75 p-3.5 target:outline-4 target:outline-bandeau"
              >
                <Link
                  href={`/profils/${p.pseudo}`}
                  className="flex items-center gap-2 font-bold hover:underline"
                >
                  <Avatar chemin={p.avatar_chemin} nom={p.pseudo} />
                  <span className="truncate">@{p.pseudo}</span>
                  <BadgeCampus campus={p.campus} />
                </Link>
                <p className="text-xs leading-relaxed text-encre-douce">
                  <strong className="text-encre">{r.niveau}</strong> · {r.aides}{" "}
                  aide{r.aides > 1 ? "s" : ""} donnée{r.aides > 1 ? "s" : ""} ·{" "}
                  {r.avis > 0 && r.note !== null
                    ? `note ${String(r.note).replace(".", ",")}/5 (${r.avis} avis)`
                    : "pas encore d'avis"}{" "}
                  · {r.badges} badge
                  {r.badges > 1 ? "s" : ""}
                </p>
                {d.message && (
                  <p className="font-main text-lg leading-snug">
                    « {d.message} »
                  </p>
                )}
                <span className="text-[11px] text-encre-douce">
                  intéressé le {dateCourte(d.cree_le)}
                </span>
                {/* Geste irréversible (les autres sont refusés) : on confirme dans un post-it (popover natif). */}
                <Bouton
                  type="button"
                  popoverTarget={`choisir-${d.id}`}
                  className="w-full"
                >
                  Je choisis @{p.pseudo}
                </Bouton>
                <div
                  id={`choisir-${d.id}`}
                  popover="auto"
                  className="m-auto w-[min(24rem,calc(100vw-2rem))] overflow-visible border-0 bg-transparent p-3 text-encre backdrop:bg-encre/30"
                >
                  <div
                    className="postit papier-jaune pop flex flex-col gap-3 p-6 pt-8"
                    style={{ "--rot": "-1deg" } as React.CSSProperties}
                  >
                    <span className="punaise" aria-hidden />
                    <strong className="text-xl leading-tight">
                      Tu choisis @{p.pseudo} ?
                    </strong>
                    <p className="text-sm leading-snug">
                      {g.demandes.length - 1 === 1
                        ? "L'autre personne intéressée sera prévenue"
                        : `Les ${g.demandes.length - 1} autres personnes intéressées seront prévenues`}{" "}
                      que c&apos;est pris, et ton post-it quittera le tableau.
                      Ce n&apos;est pas annulable.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <form action={choisirDemande.bind(null, d.id, true)}>
                        <Bouton>Oui, je choisis @{p.pseudo}</Bouton>
                      </form>
                      <button
                        type="button"
                        popoverTarget={`choisir-${d.id}`}
                        popoverTargetAction="hide"
                        className="text-sm font-semibold text-encre-douce hover:text-encre"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm font-semibold">
                  <form action={choisirDemande.bind(null, d.id, false)}>
                    <button className="text-encre-douce underline-offset-2 hover:text-encre hover:underline">
                      Accepter aussi
                    </button>
                  </form>
                  <form action={repondreDemande.bind(null, d.id, "refusee")}>
                    <button className="text-encre-douce underline-offset-2 hover:text-encre hover:underline">
                      Refuser
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="text-xs text-encre-douce">
          « Je choisis » accepte cette personne, prévient les autres et retire
          le post-it du tableau. « Accepter aussi » garde le post-it
          ouverte (covoit ou coloc à plusieurs).
        </p>
      </article>
    );
  }

  function suivi(d: Demande, prenomAutre: string) {
    if (!d.annonce || !d.demandeur) return null;
    const s = suiviDe.get(d.id);
    return (
      <>
      {d.repondu_le && <p className="text-xs text-encre/70">Accepté le {jourCampus(d.repondu_le)}</p>}
      <SuiviColette
        demandeId={d.id}
        etape={s?.etape ?? null}
        mot={s?.mot ?? null}
        aide={jeSuisAide({ type: d.annonce.type, demandeurId: d.demandeur.id, moi: user.id })}
        prenomAutre={prenomAutre}
        retour="liste"
        compact
        avisDonne={avisDonnes.has(d.id)}
        majLe={s?.maj_le ?? null}
      />
      </>
    );
  }

  function carte(d: Demande, i: number, papier: string) {
    const autre = onglet === "recues" ? d.demandeur : d.destinataire;
    if (!autre) return null;
    return (
      <article
        key={d.id}
        id={`demande-${d.id}`}
        className={`colle postit ${papier} flex scroll-mt-24 flex-col gap-3 p-5 pt-6 target:outline-4 target:outline-offset-4 target:outline-bandeau`}
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
            <BadgeCampus campus={autre.campus} />
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

        {/* Post-it de groupe : un autre membre a accepté. Ses coordonnées et celles du demandeur restent entre eux
            (règle d'or n°1) ; moi, je rejoins la discussion du groupe. */}
        {d.statut === "acceptee" && onglet === "recues" && d.destinataire && d.destinataire.id !== user.id && (
          <>
            <p className="text-sm">
              Acceptée par <strong>@{d.destinataire.pseudo}</strong> pour le groupe.
            </p>
            <BoutonLien href={`/demandes/${d.id}`} className="self-start">
              Discuter avec le groupe
            </BoutonLien>
            {suivi(d, d.destinataire.prenom)}
          </>
        )}
        {d.statut === "acceptee" && !(onglet === "recues" && d.destinataire && d.destinataire.id !== user.id) && (
          <>
            <BlocCoordonnees
              c={coordonneesDe.get(autre.id) ?? null}
              prenom={autre.prenom}
            />
            <BoutonLien href={`/demandes/${d.id}`} className="self-start">
              Discuter avec {autre.prenom}
            </BoutonLien>
            {suivi(d, autre.prenom)}
            {/* L'avis se donne surtout à la fin (dans l'Historique) ; ici, replié, pour un échange fini sans suivi. */}
            {!avisDonnes.has(d.id) && colonne(d) !== "termine" && (
              <details className="text-sm">
                <summary className="w-fit cursor-pointer font-semibold text-encre-douce hover:text-encre">Déjà fini ? Laisser un avis</summary>
                <div className="mt-2">
                  <FormulaireAvis demandeId={d.id} retour="/demandes" prenom={autre.prenom} />
                </div>
              </details>
            )}
          </>
        )}
      </article>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <TitrePage accroche="Tes mises en contact. Accepte pour échanger vos coordonnées (avant, les tiennes restent cachées), puis suis l'entraide avec Colette jusqu'au « Bien reçu ».">
        Mes échanges
      </TitrePage>

      <nav
        className="inline-flex self-start rounded-ui bg-papier-fonce p-1"
        aria-label="Échanges reçus ou envoyés"
      >
        {[
          { valeur: "recues", label: "Reçus", href: "/demandes" },
          {
            valeur: "envoyees",
            label: "Envoyés",
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
        <EtatVide
          anim={onglet === "recues" ? "dort" : "cherche"}
          titre={
            onglet === "recues"
              ? "Aucune demande reçue pour l'instant"
              : "Tu n'as envoyé aucune demande"
          }
        >
          {onglet === "recues"
            ? "Quand quelqu'un voudra te contacter pour un de tes post-its, sa demande sera punaisée ici."
            : "Trouve un post-it qui t'intéresse et clique sur « Demander le contact »."}
        </EtatVide>
      )}

      {demandes.length > 0 && (
        <div className="grid items-start gap-10 lg:grid-cols-2">
          {COLONNES[onglet].map((col) => {
            const liste = demandes.filter((d) => d.statut === col.statut && colonne(d) !== "termine");
            return (
              <section
                key={col.statut}
                className="flex flex-col gap-7"
                aria-label={col.titre}
              >
                <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-encre pb-2">
                  <span className="titre-charte text-section whitespace-nowrap">
                    {col.titre}
                  </span>
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
                {onglet === "recues" && col.statut === "en_attente" ? (
                  <>
                    {groupes.map((g, i) => groupe(g, i))}
                    {seules.map((d, i) =>
                      carte(d, groupes.length + i, col.papier),
                    )}
                  </>
                ) : (
                  liste.map((d, i) => carte(d, i, col.papier))
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Historique : une ligne par échange fini, pour retrouver qui, quoi, quand, et noter si ce n'est pas fait. */}
      {demandes.length > 0 && (
        <section className="flex flex-col gap-4" aria-label="Historique">
          <h2 className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b-2 border-encre pb-2">
            <span className="titre-charte text-section whitespace-nowrap">Historique</span>
            <span className="titre-charte rounded-[3px] bg-encre px-1.5 pt-0.5 text-sm text-surface">{historique.length}</span>
            <span className="ml-auto -rotate-2 font-main text-lg text-encre-douce">
              {onglet === "recues" ? "ceux qui t'ont contacté" : "ceux que tu as contactés"}
            </span>
          </h2>
          {historique.length === 0 && (
            <p className="font-main text-lg text-encre-douce">
              Rien pour l&apos;instant. Un échange arrive ici quand la personne aidée confirme « Bien reçu » (ou s&apos;il est refusé).
            </p>
          )}
          <ul className="flex flex-col gap-2">
            {historique.map((d) => {
              const autre = onglet === "recues" ? d.demandeur : d.destinataire;
              if (!autre) return null;
              const termine = colonne(d) === "termine";
              return (
                <li
                  key={d.id}
                  id={`demande-${d.id}`}
                  className="flex scroll-mt-24 flex-col gap-3 rounded-carte border border-ligne bg-surface px-4 py-3 target:border-encre target:shadow-[3px_3px_0_0_var(--color-bandeau)]"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <Link href={`/profils/${autre.pseudo}`} className="flex items-center gap-2 font-semibold hover:underline">
                      <Avatar chemin={autre.avatar_chemin} nom={autre.pseudo} taille="sm" />@{autre.pseudo}
                    </Link>
                    {d.annonce && (
                      <Link href={`/annonces/${d.annonce.id}`} className="min-w-0 flex-1 truncate text-sm text-encre-douce hover:text-encre hover:underline">
                        {d.annonce.titre}
                      </Link>
                    )}
                    {termine ? <Badge variante="ok">Bien reçu</Badge> : STATUTS.refusee}

                    {termine && (
                      <Link href={`/demandes/${d.id}`} className="text-sm font-semibold underline-offset-2 hover:underline">
                        Revoir la discussion
                      </Link>
                    )}
                  </div>
                  {/* Le parcours daté : demandé, accepté (ou refusé), bien reçu. */}
                  <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-encre-douce" aria-label="Étapes de l'échange">
                    {etapesDatees({ statut: d.statut, creeLe: d.cree_le, reponduLe: d.repondu_le, etape: suiviDe.get(d.id)?.etape ?? null, suiviLe: suiviDe.get(d.id)?.maj_le ?? null }).map((e, k) => (
                      <li key={e.label} className="flex items-center gap-2">
                        {k > 0 && <span aria-hidden>·</span>}
                        <span>
                          {e.label}
                          {e.date && <strong className="font-semibold text-encre"> le {e.date}</strong>}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {termine && !avisDonnes.has(d.id) && <FormulaireAvis demandeId={d.id} retour="/demandes" prenom={autre.prenom} />}
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
