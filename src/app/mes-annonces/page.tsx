import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { EtatVide } from "@/components/colette/etat-vide";

export const metadata: Metadata = { title: "Mes annonces" };

export default async function PageMesAnnonces() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data } = await supabase.from("annonces").select(SELECT_ANNONCE).eq("auteur_id", user.id).order("cree_le", { ascending: false });
  const annonces = (data ?? []) as unknown as Annonce[];
  // Post-its de groupe dont je fais partie, et invitations qui attendent ma réponse.
  const { data: groupes } = await supabase
    .from("annonce_membres")
    .select(`statut, annonce:annonces(${SELECT_ANNONCE})`)
    .eq("membre_id", user.id)
    .order("cree_le", { ascending: false });
  const liste = (groupes ?? []) as unknown as { statut: "invite" | "accepte"; annonce: Annonce | null }[];
  const invitations = liste.filter((g) => g.statut === "invite" && g.annonce).map((g) => g.annonce!);
  const enGroupe = liste.filter((g) => g.statut === "accepte" && g.annonce).map((g) => g.annonce!);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Tes annonces publiées et archivées.">Mes annonces</TitrePage>
        <BoutonLien href="/annonces/nouvelle">Publier une annonce</BoutonLien>
      </div>
      {invitations.length > 0 && (
        <section className="pop flex flex-col gap-4 rounded-carte border-2 border-encre bg-bandeau p-5 shadow-[4px_4px_0_0_var(--color-encre)]">
          <h2 className="titre-charte text-xl">
            {invitations.length} invitation{invitations.length > 1 ? "s" : ""} à rejoindre un post-it
          </h2>
          <ul className="flex flex-col gap-2">
            {invitations.map((a) => (
              <li key={a.id}>
                <Link href={`/annonces/${a.id}#equipe`} className="font-semibold underline underline-offset-2">
                  @{a.auteur?.pseudo} t&apos;invite sur « {a.titre} »
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {enGroupe.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="border-b border-ligne pb-2 text-xs font-bold tracking-[0.14em] text-encre-douce uppercase">Mes post-its de groupe</h2>
          <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {enGroupe.map((a, i) => (
              <CarteAnnonce key={a.id} annonce={a} index={i} afficherExpiration />
            ))}
          </div>
        </section>
      )}
      {enGroupe.length > 0 && annonces.length > 0 && (
        <h2 className="border-b border-ligne pb-2 text-xs font-bold tracking-[0.14em] text-encre-douce uppercase">Mes post-its</h2>
      )}
      {annonces.length > 0 ? (
        <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} afficherExpiration />
          ))}
        </div>
      ) : (
        <EtatVide
          anim="accroche"
          titre="Ton premier post-it t'attend"
          action={
            <BoutonLien href="/annonces/nouvelle" variante="contour">
              Publier ma première annonce
            </BoutonLien>
          }
        >
          Propose une compétence ou demande un coup de main au campus. Colette le punaise sur le tableau.
        </EtatVide>
      )}
    </div>
  );
}
