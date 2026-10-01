import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <TitrePage accroche="Tes annonces publiées et archivées.">Mes annonces</TitrePage>
        <BoutonLien href="/annonces/nouvelle">Publier une annonce</BoutonLien>
      </div>
      {annonces.length > 0 ? (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} afficherExpiration />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-carte border border-dashed border-ligne-forte p-6">
          <strong>Tu n&apos;as pas encore publié d&apos;annonce</strong>
          <p className="text-sm text-encre-douce">Propose une compétence ou demande un coup de main au campus.</p>
          <BoutonLien href="/annonces/nouvelle" variante="contour">
            Publier ma première annonce
          </BoutonLien>
        </div>
      )}
    </div>
  );
}
