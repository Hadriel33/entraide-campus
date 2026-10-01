import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireConnexion } from "./formulaire";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Se connecter" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ lien?: string }>;
}) {
  if (await getUtilisateur()) redirect("/bureau");
  const { lien } = await searchParams;

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-8 py-12">
      <div className="flex items-end gap-3">
        <TitrePage accroche="Content de te revoir.">Se connecter</TitrePage>
        <Colette anim="coucou" taille={70} className="mb-1 ml-auto shrink-0" />
      </div>
      {lien === "invalide" && (
        <p role="alert" className="mb-6 text-sm text-alerte">
          Ce lien de confirmation est invalide ou a expiré. Connecte-toi ou recrée ton compte.
        </p>
      )}
      <div className="postit papier-gris p-6 pt-8 sm:p-8 sm:pt-10" style={{ "--rot": "-0.6deg" } as React.CSSProperties}>
        <span className="punaise" aria-hidden />
        <FormulaireConnexion />
      </div>
    </section>
  );
}
