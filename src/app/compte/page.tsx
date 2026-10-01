import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { deconnecter } from "../(auth)/actions";

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
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Salut {profil?.prenom ?? ""}</h1>
      <p className="mb-8 text-encre-douce">
        {profil?.ecole} · {user.email}
      </p>
      <form action={deconnecter}>
        <button className="rounded-md border border-encre px-4 py-2.5 font-medium">Se déconnecter</button>
      </form>
    </section>
  );
}
