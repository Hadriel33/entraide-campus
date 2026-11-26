import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import { lireEtatAccueil } from "@/lib/profils/etat-accueil";
import { ChecklistAccueil } from "@/components/profil/checklist-accueil";
import { etapesAccueil } from "@/lib/profils/accueil";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

export const metadata: Metadata = { title: "Bienvenue" };

export default async function PageBienvenue() {
  const { supabase, profil } = await exigerSession();
  const etat = await lireEtatAccueil(supabase, profil);
  const suivante = etapesAccueil(etat).etapes.find((e) => !e.fait);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-end gap-4">
        <TitrePage accroche={`Bienvenue @${profil.pseudo} ! Quatre étapes, dans l'ordre, et tu peux aider comme te faire aider.`}>Bienvenue</TitrePage>
        <Colette anim="coucou" taille={100} className="ml-auto hidden shrink-0 sm:block" />
      </div>
      <ChecklistAccueil etat={etat} grand />
      <div className="flex flex-wrap gap-3">
        {/* Le parcours : la première étape pas encore faite, puis le bureau (où Colette fait la visite). */}
        {suivante ? <BoutonLien href={suivante.lien}>Commencer : {suivante.titre.toLowerCase()}</BoutonLien> : <BoutonLien href="/bureau">Aller à mon bureau</BoutonLien>}
        {suivante && (
          <BoutonLien href="/bureau" variante="contour">
            Plus tard, voir mon bureau
          </BoutonLien>
        )}
      </div>
      <p className="text-sm text-encre-douce">Tout s&apos;enregistre tout seul. Sur ton bureau, Colette te fait ensuite la visite en cinq bulles.</p>
    </div>
  );
}
