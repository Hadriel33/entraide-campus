import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import { TitrePage } from "@/components/ui/titre-page";
import { FormulaireMotDePasse } from "./formulaire";

export const metadata: Metadata = { title: "Nouveau mot de passe" };

export default async function PageMotDePasse() {
  await exigerSession();
  return (
    <section className="mx-auto w-full max-w-sm">
      <div className="mb-8">
        <TitrePage accroche="Choisis un nouveau mot de passe pour ton compte.">Mot de passe</TitrePage>
      </div>
      <FormulaireMotDePasse />
    </section>
  );
}
