import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireInscription } from "./formulaire";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function PageInscription() {
  if (await getUtilisateur()) redirect("/compte");

  return (
    <section className="mx-auto w-full max-w-sm py-12">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Créer un compte</h1>
      <p className="mb-8 text-encre-douce">Un seul compte pour proposer et pour chercher.</p>
      <FormulaireInscription />
    </section>
  );
}
