import Image from "next/image";

const TAILLES = { sm: 24, md: 32, lg: 44, xl: 96 } as const;

export function urlAvatar(chemin: string | null | undefined) {
  if (!chemin) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${chemin}`;
}

// Photo de profil, ou initiales du pseudo sur fond doux si aucune photo.
export function Avatar({ chemin, nom, taille = "md" }: { chemin?: string | null; nom: string; taille?: keyof typeof TAILLES }) {
  const px = TAILLES[taille];
  const url = urlAvatar(chemin);
  const initiales = nom.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase() || "?";

  if (url) {
    return <Image src={url} alt="" width={px} height={px} className="shrink-0 rounded-full object-cover" style={{ width: px, height: px }} />;
  }
  return (
    <span
      aria-hidden
      className="flex shrink-0 items-center justify-center rounded-full bg-papier-fonce font-semibold text-encre"
      style={{ width: px, height: px, fontSize: Math.round(px * 0.38) }}
    >
      {initiales}
    </span>
  );
}
