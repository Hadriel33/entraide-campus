import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireInscription } from "./formulaire";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Créer un compte" };

export default async function PageInscription() {
  if (await getUtilisateur()) redirect("/bureau");

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <div className="flex items-end gap-3">
        <TitrePage accroche="Un seul compte pour proposer et pour chercher.">Créer un compte</TitrePage>
        <Colette anim="saute" taille={70} className="mb-1 ml-auto shrink-0" />
      </div>
      <div className="postit papier-jaune p-6 pt-8 sm:p-8 sm:pt-10" style={{ "--rot": "0.6deg" } as React.CSSProperties}>
        <span className="punaise" aria-hidden />
        <FormulaireInscription />
      </div>
      <p className="-rotate-1 text-center font-main text-lg text-alerte">avec ton mail @mail-esd.com ou @mail-esp.com</p>
    </section>
  );
}
