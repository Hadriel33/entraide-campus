import { redirect } from "next/navigation";
import { getUtilisateur } from "@/lib/supabase/server";
import { BoutonLien } from "@/components/ui/bouton";
import { Badge } from "@/components/ui/badge";
import { TitrePage } from "@/components/ui/titre-page";

export default async function Home() {
  // Connecté : on va directement aux annonces.
  if (await getUtilisateur()) redirect("/annonces");

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 py-16">
      <TitrePage accroche="Propose ce que tu sais faire, trouve ce dont tu as besoin. Entre étudiants de l'ESD et de l'ESP Bordeaux.">
        L&apos;entraide du campus
      </TitrePage>
      <div className="flex flex-wrap gap-2">
        <Badge variante="offre">Je propose : photo, vidéo, design, dev, data</Badge>
        <Badge variante="besoin">Je cherche : coloc, covoiturage, coup de main</Badge>
      </div>
      <p className="max-w-xl text-encre-douce">
        Tes coordonnées restent cachées. Elles ne s&apos;échangent qu&apos;après ton accord.
      </p>
      <div className="flex flex-wrap gap-3">
        <BoutonLien href="/inscription">Créer mon compte</BoutonLien>
        <BoutonLien href="/connexion" variante="contour">
          Se connecter
        </BoutonLien>
      </div>
    </section>
  );
}
