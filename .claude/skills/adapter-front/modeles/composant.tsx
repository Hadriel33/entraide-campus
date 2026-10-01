// Modèle de composant compatible avec tous les thèmes : uniquement des jetons.
// Exemple : une carte d'annonce (étape 4).
import { BoutonLien } from "@/components/ui/bouton";

type Props = { id: string; titre: string; categorie: string; auteur: string; ecole: string };

export function CarteAnnonce({ id, titre, categorie, auteur, ecole }: Props) {
  return (
    <article className="flex flex-col gap-3 border-t border-ligne py-5">
      <p className="text-sm text-encre-douce">{categorie}</p>
      <h2 className="font-titre text-xl leading-tight">{titre}</h2>
      <p className="text-sm text-encre-douce">
        {auteur} · {ecole}
      </p>
      <div>
        <BoutonLien href={`/annonces/${id}`} variante="contour">
          Voir l&apos;annonce
        </BoutonLien>
      </div>
    </article>
  );
}
