import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { ChecklistAccueil } from "@/components/profil/checklist-accueil";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function PageBienvenue() {
  const { supabase, profil } = await exigerSession();
  const etat = await lireEtatAccueil(supabase, profil);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <TitrePage accroche={`Bienvenue @${profil.pseudo} ! Quatre petites étapes et ton profil est prêt à servir.`}>
        Bienvenue
      </TitrePage>
      <ChecklistAccueil etat={etat} grand />
      <div className="flex flex-wrap gap-3">
        <BoutonLien href="/annonces">Voir les annonces</BoutonLien>
        <BoutonLien href="/classement" variante="contour">
          Comment gagner des points
        </BoutonLien>
      </div>
    </div>
  );
}
