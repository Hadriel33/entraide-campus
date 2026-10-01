import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireInscription } from "./formulaire";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function PageInscription() {
  if (await getUtilisateur()) redirect("/annonces");

  return (
    <section className="mx-auto w-full max-w-sm py-12">
      <div className="mb-8">
        <TitrePage accroche="Un seul compte pour proposer et pour chercher.">Créer un compte</TitrePage>
      </div>
      <FormulaireInscription />
    </section>
  );
}
