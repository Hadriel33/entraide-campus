import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { FormulaireConnexion } from "./formulaire";

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
      <h1 className="mb-8 text-3xl font-semibold tracking-tight">Se connecter</h1>
      {lien === "invalide" && (
        <p role="alert" className="mb-6 text-sm text-alerte">
          Ce lien de confirmation est invalide ou a expiré. Connecte-toi ou recrée ton compte.
        </p>
      )}
      <FormulaireConnexion />
    </section>
  );
}
