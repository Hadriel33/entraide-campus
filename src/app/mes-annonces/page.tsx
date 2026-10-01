import type { Metadata } from "next";
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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Tes annonces publiées et archivées.">Mes annonces</TitrePage>
        <BoutonLien href="/annonces/nouvelle">Publier une annonce</BoutonLien>
      </div>
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
          Propose une compétence ou demande un coup de main au campus. Colette le colle sur le mur.
        </EtatVide>
      )}
    </div>
  );
}
