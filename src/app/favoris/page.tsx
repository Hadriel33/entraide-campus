import type { Metadata } from "next";
import { exigerSession } from "@/lib/session";
import { SELECT_ANNONCE, type Annonce } from "@/lib/annonces/requetes";
import { CarteAnnonce } from "@/components/annonces/carte-annonce";
import { BoutonLien } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { EtatVide } from "@/components/colette/etat-vide";

export const metadata: Metadata = { title: "Favoris" };

export default async function PageFavoris() {
  const { supabase, user } = await exigerSession();
  const { data } = await supabase
    .from("favoris")
    .select(`cree_le, annonce:annonces(${SELECT_ANNONCE})`)
    .eq("profil_id", user.id)
    .order("cree_le", { ascending: false });
  // Une annonce supprimée, masquée ou devenue invisible disparaît d'elle-même (RLS + jointure vide).
  const annonces = ((data ?? []) as unknown as { annonce: Annonce | null }[]).map((f) => f.annonce).filter((a): a is Annonce => !!a);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <TitrePage accroche="Les annonces que tu as gardées de côté. Elles ne sont visibles que par toi.">Favoris</TitrePage>
      {annonces.length ? (
        <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2 lg:grid-cols-3">
          {annonces.map((a, i) => (
            <CarteAnnonce key={a.id} annonce={a} index={i} />
          ))}
        </div>
      ) : (
        <EtatVide
          anim="cherche"
          titre="Pas encore de favori"
          action={
            <BoutonLien href="/annonces" variante="contour">
              Voir les annonces
            </BoutonLien>
          }
        >
          Sur une annonce, clique sur le cœur pour la retrouver ici.
        </EtatVide>
      )}
    </div>
  );
}
