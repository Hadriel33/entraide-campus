import type { Metadata } from "next";
import { FormulaireAnnonce } from "@/components/annonces/formulaire-annonce";
import { TitrePage } from "@/components/ui/titre-page";
import { creerAnnonce } from "../actions";

export const metadata: Metadata = { title: "Publier une annonce" };

export default function PageNouvelleAnnonce() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <TitrePage accroche="Ce que tu sais faire, ou ce dont tu as besoin. Ton annonce est visible par les étudiants connectés.">
        Publier une annonce
      </TitrePage>
      <FormulaireAnnonce action={creerAnnonce} libelle="Publier l'annonce" annulerVers="/annonces" />
    </div>
  );
}
