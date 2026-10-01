import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireConnexion } from "./formulaire";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Se connecter" };

export default async function PageConnexion({
  searchParams,
}: {
  searchParams: Promise<{ lien?: string }>;
}) {
  if (await getUtilisateur()) redirect("/compte");
  const { lien } = await searchParams;

  return (
    <section className="mx-auto w-full max-w-sm py-12">
      <div className="mb-8">
        <TitrePage accroche="Content de te revoir.">Se connecter</TitrePage>
      </div>
      {lien === "invalide" && (
        <p role="alert" className="mb-6 text-sm text-alerte">
          Ce lien de confirmation est invalide ou a expiré. Connecte-toi ou recrée ton compte.
        </p>
      )}
      <FormulaireConnexion />
    </section>
  );
}
