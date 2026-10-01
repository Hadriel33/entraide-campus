import type { NextConfig } from "next";

const supabase = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://oobnrocwpyyeaadbhweu.supabase.co");

const nextConfig: NextConfig = {
  images: {
    // Seules les photos de profil du bucket public « avatars » sont autorisées.
    remotePatterns: [new URL(`${supabase.origin}/storage/v1/object/public/avatars/**`)],
  },
  experimental: {
    serverActions: {
      // Photo de profil : 2 Mo maximum (vérifié aussi côté serveur et par le bucket).
      bodySizeLimit: "3mb",
    },
  },
};

export default nextConfig;
