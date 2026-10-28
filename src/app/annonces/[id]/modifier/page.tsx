import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulaireAnnonce } from "@/components/annonces/formulaire-annonce";
import { TitrePage } from "@/components/ui/titre-page";
import { modifierAnnonce } from "../../actions";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function PageModifierAnnonce({ params }: PageProps<"/annonces/[id]/modifier">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: annonce } = await supabase
    .from("annonces")
    .select("id, auteur_id, type, categorie, titre, description, contrepartie, lieu, quartier, tram")
    .eq("id", id)
    .maybeSingle();

  // Ni l'auteur ni un membre du groupe : on répond comme si l'annonce n'existait pas. La RLS bloquerait de toute façon l'écriture.
  const estMembre = annonce && user && annonce.auteur_id !== user.id ? (await supabase.rpc("est_membre_annonce", { annonce: annonce.id })).data === true : false;
  if (!annonce || (annonce.auteur_id !== user?.id && !estMembre)) notFound();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <TitrePage>Modifier l&apos;annonce</TitrePage>
      <FormulaireAnnonce
        action={modifierAnnonce.bind(null, annonce.id)}
        initial={{ ...annonce, lieu: annonce.lieu ?? "", quartier: annonce.quartier ?? "", tram: annonce.tram ?? "" }}
        libelle="Enregistrer"
        annulerVers={`/annonces/${annonce.id}`}
        campus={(await getSession()).profil?.campus}
      />
    </div>
  );
}
