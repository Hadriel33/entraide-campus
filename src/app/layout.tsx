import type { Metadata } from "next";
import { Archivo, DM_Sans, Source_Serif_4 } from "next/font/google";
import { createClient } from "@/lib/supabase/server";
import { BarreLaterale, EnTetePublic } from "@/components/app/navigation";
import "./globals.css";

// Polices de la DA « Campus 2026 » : Archivo (axe de largeur pour les titres condensés),
// DM Sans pour le texte, Source Serif 4 pour les accroches.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const metadata: Metadata = {
  title: { default: "L'entraide du campus", template: "%s · L'entraide du campus" },
  description: "Propose ce que tu sais faire, trouve ce dont tu as besoin, entre étudiants ESD et ESP Bordeaux.",
};

function PiedDePage() {
  return (
    <footer className="border-t border-ligne px-4 py-4 text-center text-xs text-encre-douce">
      Projet étudiant non officiel, réalisé dans le cadre du module Vibe Coding (M2 Data).
    </footer>
  );
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profil } = user
    ? await supabase.from("profils").select("prenom, ecole").eq("id", user.id).single()
    : { data: null };

  return (
    <html lang="fr" className={`${archivo.variable} ${dmSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        {user ? (
          <div className="flex min-h-dvh flex-col md:flex-row">
            <BarreLaterale prenom={profil?.prenom ?? "Moi"} ecole={profil?.ecole ?? ""} />
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="flex-1 px-4 py-8 sm:px-8">{children}</main>
              <PiedDePage />
            </div>
          </div>
        ) : (
          <div className="flex min-h-dvh flex-col">
            <EnTetePublic />
            <main className="flex flex-1 flex-col px-4">{children}</main>
            <PiedDePage />
          </div>
        )}
      </body>
    </html>
  );
}
