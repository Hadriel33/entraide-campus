import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deconnecter } from "../(auth)/actions";
import { Bouton } from "@/components/ui/bouton";

export const metadata: Metadata = { title: "Mon compte" };

export default async function PageCompte() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profil } = await supabase.from("profils").select("prenom, ecole").eq("id", user.id).single();

  return (
    <section className="mx-auto w-full max-w-sm py-12">
      <h1 className="font-titre mb-2 text-3xl font-semibold tracking-tight">Salut {profil?.prenom ?? ""}</h1>
      <p className="mb-8 text-encre-douce">
        {profil?.ecole} · {user.email}
      </p>
      <form action={deconnecter}>
        <Bouton variante="contour">Se déconnecter</Bouton>
      </form>
    </section>
  );
}
