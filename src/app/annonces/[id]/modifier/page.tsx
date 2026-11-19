import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormulaireAnnonce } from "@/components/annonces/formulaire-annonce";
import { TitrePage } from "@/components/ui/titre-page";
import { changerStatut, modifierAnnonce, prolongerAnnonce, supprimerAnnonce } from "../../actions";
import { Bouton, BoutonLien } from "@/components/ui/bouton";
import { BoutonPartager } from "@/components/annonces/bouton-partager";
import { joursRestants } from "@/lib/annonces/expiration";
import { getSession } from "@/lib/session";
import { urlPhotoAnnonce } from "@/lib/annonces/photo";

export const metadata: Metadata = { title: "Modifier le post-it" };

export default async function PageModifierAnnonce({ params }: PageProps<"/annonces/[id]/modifier">) {
  const { id } = await params;
  const { supabase, user, profil } = await getSession();
  const { data: annonce } = await supabase
    .from("annonces")
    .select("id, auteur_id, type, categorie, titre, description, contrepartie, lieu, quartier, tram, photo_chemin, statut, expire_le")
    .eq("id", id)
    .maybeSingle();

  // Ni l'auteur ni un membre du groupe : on répond comme si l'annonce n'existait pas. La RLS bloquerait de toute façon l'écriture.
  const estMembre = annonce && user && annonce.auteur_id !== user.id ? (await supabase.rpc("est_membre_annonce", { annonce: annonce.id })).data === true : false;
  if (!annonce || (annonce.auteur_id !== user?.id && !estMembre)) notFound();

  const estAuteur = annonce.auteur_id === user?.id;
  const jours = joursRestants(annonce.expire_le);
  const titreSection = "titre-charte text-section";

  // Trois parties bien séparées : le post-it lui-même, le partage, les réglages (retour de test du 19/11).
  return (
    <div className="flex w-full max-w-2xl flex-col gap-8">
      <TitrePage>Modifier le post-it</TitrePage>
      <nav aria-label="Sur cette page" className="flex flex-wrap gap-2 text-sm font-semibold">
        {[["#contenu", "1. Le post-it"], ["#partage", "2. Partager"], ["#reglages", "3. Réglages"]].map(([href, label]) => (
          <a key={href} href={href} className="presse rounded-full border border-ligne-forte bg-surface px-3 py-1.5 hover:bg-papier-fonce">
            {label}
          </a>
        ))}
      </nav>
      <h2 id="contenu" className={titreSection}>1. Le post-it</h2>
      <FormulaireAnnonce
        action={modifierAnnonce.bind(null, annonce.id)}
        initial={{ ...annonce, lieu: annonce.lieu ?? "", quartier: annonce.quartier ?? "", tram: annonce.tram ?? "" }}
        libelle="Enregistrer"
        annulerVers={`/annonces/${annonce.id}`}
        campus={profil?.campus}
        photoActuelle={urlPhotoAnnonce(annonce.photo_chemin)}
      />

      <section id="partage" className="flex scroll-mt-6 flex-col gap-3 border-t border-ligne pt-6">
        <h2 className={titreSection}>2. Partager</h2>
        <p className="text-sm text-encre-douce">Fais-le circuler dans un salon ou une discussion, ou envoie son lien.</p>
        <div className="flex flex-wrap gap-2">
          {annonce.statut === "publiee" && (
            <BoutonLien href={`/annonces/${annonce.id}?partager=1#partager`} variante="contour">
              Partager dans un salon ou une discussion
            </BoutonLien>
          )}
          <BoutonPartager titre={annonce.titre} />
        </div>
      </section>

      <section id="reglages" className="flex scroll-mt-6 flex-col gap-3 border-t border-ligne pt-6">
        <h2 className={titreSection}>3. Réglages</h2>
        <p className="text-sm text-encre-douce">
          {annonce.statut === "publiee" ? (jours > 0 ? `En ligne encore ${jours} jour${jours > 1 ? "s" : ""}.` : "Expiré : il n'apparaît plus sur le tableau.") : annonce.statut === "archivee" ? "Archivé : il n'apparaît plus sur le tableau." : "Masqué par la modération."}{" "}
          L&apos;équipe du post-it se gère depuis sa page.
        </p>
        {estAuteur && (
          <div className="flex flex-wrap gap-2">
            {annonce.statut === "publiee" && jours <= 7 && (
              <form action={prolongerAnnonce.bind(null, annonce.id)}>
                <Bouton variante="contour">{jours === 0 ? "Remettre en ligne" : "Prolonger"}</Bouton>
              </form>
            )}
            {annonce.statut !== "masquee" && (
              <form action={changerStatut.bind(null, annonce.id, annonce.statut === "publiee" ? "archivee" : "publiee")}>
                <Bouton variante="contour">{annonce.statut === "publiee" ? "Archiver" : "Republier"}</Bouton>
              </form>
            )}
            <form action={supprimerAnnonce.bind(null, annonce.id)}>
              <Bouton variante="danger">Supprimer</Bouton>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
