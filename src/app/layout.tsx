import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, DM_Sans, Source_Serif_4 } from "next/font/google";
import { getSession } from "@/lib/session";
import { BarreLaterale, EnTetePublic } from "@/components/app/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Toast } from "@/components/ui/toast";
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
  const { supabase, user, profil } = await getSession();
  const { count: enAttente } = user
    ? await supabase
        .from("demandes_contact")
        .select("id", { count: "exact", head: true })
        .eq("destinataire_id", user.id)
        .eq("statut", "en_attente")
    : { count: 0 };

  return (
    <html lang="fr" className={`${archivo.variable} ${dmSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Suspense>
          <Toast />
        </Suspense>
        {user && profil ? (
          <div className="flex min-h-dvh flex-col md:flex-row">
            <BarreLaterale
              pseudo={profil.pseudo}
              ecole={profil.ecole}
              avatar={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} />}
              demandesEnAttente={enAttente ?? 0}
              estAdmin={profil.role === "admin"}
            />
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
