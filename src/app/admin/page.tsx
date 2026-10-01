import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerSession } from "@/lib/session";
import { dateCourte } from "@/lib/annonces/requetes";
import { CATEGORIES } from "@/lib/annonces/validation";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeEcole } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { changerRole, modererAnnonce, supprimerAnnonceAdmin, traiterSignalement } from "./actions";

export const metadata: Metadata = { title: "Admin" };

const MOTIFS: Record<string, string> = {
  arnaque: "Arnaque",
  inapproprie: "Inapproprié",
  coordonnees: "Coordonnées dans l'annonce",
  hors_sujet: "Hors sujet",
  autre: "Autre",
};

type StatsAdmin = { etudiants: number; annonces: number; mises_en_relation: number; signalements_ouverts: number };

export default async function PageAdmin({ searchParams }: PageProps<"/admin">) {
  const { supabase, user, profil } = await exigerSession();
  // Un non-admin reçoit une 404 : on ne révèle même pas que la page existe.
  if (profil.role !== "admin") notFound();
  const onglet = (await searchParams).onglet === "etudiants" ? "etudiants" : "moderation";

  const [{ data: stats }, { data: signalements }, { data: annonces }, { data: etudiants }] = await Promise.all([
    supabase.rpc("stats_admin"),
    supabase
      .from("signalements")
      .select("id, motif, details, cree_le, annonce:annonces(id, titre, statut), auteur:profils!signalements_auteur_id_fkey(pseudo)")
      .eq("statut", "ouvert")
      .order("cree_le", { ascending: false }),
    supabase
      .from("annonces")
      .select("id, titre, categorie, statut, cree_le, auteur:profils!annonces_auteur_id_fkey(pseudo)")
      .order("cree_le", { ascending: false })
      .limit(50),
    onglet === "etudiants"
      ? supabase.from("profils").select("id, pseudo, prenom, ecole, avatar_chemin, role, cree_le").order("cree_le", { ascending: false }).limit(200)
      : Promise.resolve({ data: [] }),
  ]);
  const s = stats as StatsAdmin | null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <TitrePage accroche="Modération des annonces, signalements et rôles. Chaque action est vérifiée par la base.">Admin</TitrePage>

      {s && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "étudiants inscrits", valeur: s.etudiants },
            { label: "annonces publiées", valeur: s.annonces },
            { label: "mises en relation", valeur: s.mises_en_relation },
            { label: "signalements à traiter", valeur: s.signalements_ouverts, alerte: s.signalements_ouverts > 0 },
          ].map((t, i) => (
            <div key={t.label} className="apparition rounded-carte border border-ligne bg-surface p-4" style={{ "--i": i } as React.CSSProperties}>
              <dd className={`titre-charte text-3xl ${t.alerte ? "text-accent" : ""}`}>{t.valeur}</dd>
              <dt className="text-sm text-encre-douce">{t.label}</dt>
            </div>
          ))}
        </dl>
      )}

      <nav className="inline-flex self-start rounded-ui bg-papier-fonce p-1" aria-label="Sections admin">
        {[
          { valeur: "moderation", label: "Modération", href: "/admin" },
          { valeur: "etudiants", label: "Étudiants et rôles", href: "/admin?onglet=etudiants" },
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

      {onglet === "moderation" ? (
        <>
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Signalements à traiter</h2>
            {signalements?.length ? (
              <ul className="flex flex-col gap-2.5">
                {(signalements as unknown as {
                  id: string;
                  motif: string;
                  details: string | null;
                  cree_le: string;
                  annonce: { id: string; titre: string; statut: string } | null;
                  auteur: { pseudo: string } | null;
                }[]).map((sig) => (
                  <li key={sig.id} className="apparition flex flex-col gap-2 rounded-carte border border-ligne bg-surface p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <Badge variante="besoin">{MOTIFS[sig.motif]}</Badge>
                      <span className="text-encre-douce">
                        par @{sig.auteur?.pseudo} · {dateCourte(sig.cree_le)}
                      </span>
                    </div>
                    {sig.annonce && (
                      <Link href={`/annonces/${sig.annonce.id}`} className="font-semibold hover:underline">
                        {sig.annonce.titre}
                      </Link>
                    )}
                    {sig.details && <p className="font-serif text-sm">{sig.details}</p>}
                    <div className="flex flex-wrap gap-2">
                      {sig.annonce && sig.annonce.statut !== "masquee" && (
                        <form action={modererAnnonce.bind(null, sig.annonce.id, "masquee")}>
                          <Bouton variante="danger">Masquer l&apos;annonce</Bouton>
                        </form>
                      )}
                      <form action={traiterSignalement.bind(null, sig.id)}>
                        <Bouton variante="contour">Marquer comme traité</Bouton>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-encre-douce">Aucun signalement ouvert. Tout est calme.</p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Dernières annonces</h2>
            <div className="overflow-x-auto rounded-carte border border-ligne bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ligne text-encre-douce">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Annonce</th>
                    <th className="px-4 py-2.5 font-medium">Auteur</th>
                    <th className="px-4 py-2.5 font-medium">Statut</th>
                    <th className="px-4 py-2.5 font-medium">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ligne">
                  {(annonces as unknown as { id: string; titre: string; categorie: keyof typeof CATEGORIES; statut: string; cree_le: string; auteur: { pseudo: string } | null }[] | null)?.map((a) => (
                    <tr key={a.id}>
                      <td className="px-4 py-2.5">
                        <Link href={`/annonces/${a.id}`} className="font-medium hover:underline">
                          {a.titre}
                        </Link>
                        <span className="block text-xs text-encre-douce">
                          {CATEGORIES[a.categorie]} · {dateCourte(a.cree_le)}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">@{a.auteur?.pseudo}</td>
                      <td className="px-4 py-2.5">
                        <Badge variante={a.statut === "masquee" ? "besoin" : a.statut === "publiee" ? "ok" : "neutre"}>
                          {a.statut === "masquee" ? "Masquée" : a.statut === "publiee" ? "Publiée" : "Archivée"}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-end gap-1.5">
                          <form action={modererAnnonce.bind(null, a.id, a.statut === "masquee" ? "publiee" : "masquee")}>
                            <Bouton variante="discret" className="min-h-8 px-2.5 text-sm">
                              {a.statut === "masquee" ? "Rétablir" : "Masquer"}
                            </Bouton>
                          </form>
                          <form action={supprimerAnnonceAdmin.bind(null, a.id)}>
                            <Bouton variante="danger" className="min-h-8 px-2.5 text-sm">
                              Supprimer
                            </Bouton>
                          </form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Étudiants et rôles</h2>
          <ul className="flex flex-col gap-2">
            {(etudiants as { id: string; pseudo: string; prenom: string; ecole: string; avatar_chemin: string | null; role: string; cree_le: string }[] | null)?.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-carte border border-ligne bg-surface p-3">
                <Avatar chemin={e.avatar_chemin} nom={e.pseudo} />
                <Link href={`/profils/${e.pseudo}`} className="min-w-0 flex-1 hover:underline">
                  <span className="font-semibold">@{e.pseudo}</span> <span className="text-sm text-encre-douce">{e.prenom}</span>
                </Link>
                <BadgeEcole ecole={e.ecole} />
                {e.role === "admin" ? <Badge variante="ok">Admin</Badge> : <Badge>Étudiant</Badge>}
                {e.id !== user.id && (
                  <form action={changerRole.bind(null, e.id, e.role === "admin" ? "etudiant" : "admin")}>
                    <Bouton variante="contour" className="min-h-8 px-2.5 text-sm">
                      {e.role === "admin" ? "Retirer admin" : "Nommer admin"}
                    </Bouton>
                  </form>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
