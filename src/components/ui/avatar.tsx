import Image from "next/image";
import { Colette, coletteParDefaut, type Accessoire, type CouleurColette, type Humeur, type Motif } from "@/components/colette/colette";

const TAILLES = { sm: 24, md: 32, lg: 44, xl: 96 } as const;

export function urlAvatar(chemin: string | null | undefined) {
  if (!chemin) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${chemin}`;
}

export type PrefsColette = { colette_couleur?: string | null; colette_humeur?: string | null; colette_accessoire?: string | null; colette_motif?: string | null };

// Photo de profil, ou sa Colette (choisie dans le profil, sinon une couleur tirée du pseudo).
export function Avatar({
  chemin,
  nom,
  taille = "md",
  colette,
}: {
  chemin?: string | null;
  nom: string;
  taille?: keyof typeof TAILLES;
  colette?: PrefsColette | null;
}) {
  const px = TAILLES[taille];
  const url = urlAvatar(chemin);

  if (url) {
    return <Image src={url} alt="" width={px} height={px} className="shrink-0 rounded-full object-cover" style={{ width: px, height: px }} />;
  }
  const couleur = (colette?.colette_couleur || coletteParDefaut(nom).couleur) as CouleurColette;
  return (
    <span aria-hidden className="flex shrink-0 items-end justify-center overflow-hidden rounded-full bg-papier-fonce" style={{ width: px, height: px }}>
      <Colette
        tete
        taille={Math.round(px * 0.92)}
        couleur={couleur}
        humeur={(colette?.colette_humeur as Humeur) || "contente"}
        accessoire={px >= 40 ? ((colette?.colette_accessoire as Accessoire) || "aucun") : "aucun"}
        motif={(colette?.colette_motif as Motif) || "uni"}
        saison={false}
      />
    </span>
  );
}
