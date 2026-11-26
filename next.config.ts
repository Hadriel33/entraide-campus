import type { NextConfig } from "next";

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oobnrocwpyyeaadbhweu.supabase.co");

// En-têtes de sécurité (chasse aux failles à blanc du 01/10) :
// - frame-ancestors / X-Frame-Options : personne ne peut afficher l'appli dans une iframe (anti-clickjacking) ;
// - nosniff : le navigateur ne devine pas le type des fichiers ;
// - Referrer-Policy : on ne divulgue pas les adresses internes (ex. /annonces/<id>) aux autres sites ;
// - Permissions-Policy : caméra, micro et géolocalisation coupés, l'appli n'en a pas besoin.
const ENTETES = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  // Métadonnées toujours dans <head>, d'un bloc (doc Next.js « Streaming metadata », option documentée pour le
  // désactiver). Sinon, selon la vitesse de la réponse, elles arrivaient à la fin du <body> et React trouvait un
  // <meta charset> là où il attendait la page : erreur d'hydratation #418 sur Réglages, un jour sur deux (robot).
  // Nos métadonnées sont fixes ou lues en cache : rien à attendre de plus.
  htmlLimitedBots: /.*/,
  images: {
    // Seules les photos de profil du bucket public « avatars » sont autorisées.
    remotePatterns: [
      new URL(`${supabase.origin}/storage/v1/object/public/avatars/**`),
      new URL(`${supabase.origin}/storage/v1/object/public/annonces/**`), // photos des post-its (0031)
    ],
  },
  experimental: {
    serverActions: {
      // Photo de profil et CV : 2 Mo maximum (vérifié aussi côté serveur et par le bucket).
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: ENTETES }];
  },
};

export default nextConfig;
