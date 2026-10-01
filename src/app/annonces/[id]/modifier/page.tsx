import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FormulaireAnnonce } from "@/components/annonces/formulaire-annonce";
import { TitrePage } from "@/components/ui/titre-page";
import { modifierAnnonce } from "../../actions";

export const metadata: Metadata = { title: "Modifier l'annonce" };

export default async function PageModifierAnnonce({ params }: PageProps<"/annonces/[id]/modifier">) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: annonce } = await supabase
    .from("annonces")
    .select("id, auteur_id, type, categorie, titre, description, contrepartie, lieu")
    .eq("id", id)
    .maybeSingle();

  // Pas l'auteur : on répond comme si l'annonce n'existait pas. La RLS bloquerait de toute façon l'écriture.
  if (!annonce || annonce.auteur_id !== user?.id) notFound();

  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <TitrePage>Modifier l&apos;annonce</TitrePage>
      <FormulaireAnnonce
        action={modifierAnnonce.bind(null, annonce.id)}
        initial={{ ...annonce, lieu: annonce.lieu ?? "" }}
        libelle="Enregistrer"
        annulerVers={`/annonces/${annonce.id}`}
      />
    </div>
  );
}
