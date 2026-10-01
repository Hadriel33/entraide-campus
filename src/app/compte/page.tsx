import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deconnecter } from "../(auth)/actions";
import { Bouton } from "@/components/ui/bouton";
import { BadgeEcole } from "@/components/ui/badge";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageCompte() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("profils").select("prenom, ecole").eq("id", user.id).single();

  return (
    <section className="w-full max-w-xl">
      <div className="mb-6">
        <TitrePage accroche="Ton compte et tes informations.">Salut {profil?.prenom ?? ""}</TitrePage>
      </div>
      <p className="mb-8 flex items-center gap-2 text-encre-douce">
        {profil?.ecole && <BadgeEcole ecole={profil.ecole} />}
        {user.email}
      </p>
      <form action={deconnecter}>
        <Bouton variante="contour">Se déconnecter</Bouton>
      </form>
    </section>
  );
}
