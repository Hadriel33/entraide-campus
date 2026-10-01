import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Archivo, DM_Sans, Source_Serif_4 } from "next/font/google";
import { getSession } from "@/lib/session";
import { BarreLaterale, EnTetePublic } from "@/components/app/navigation";
import { Avatar } from "@/components/ui/avatar";
import { Toast } from "@/components/ui/toast";
import { Palette } from "@/components/app/palette";
import "./globals.css";

// Polices de la DA « Campus 2026 » : Archivo (axe de largeur pour les titres condensés),
// DM Sans pour le texte, Source Serif 4 pour les accroches.
const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif" });

export const metadata: Metadata = {
  title: { default: "L'entraide du campus", template: "%s · L'entraide du campus" },
  description: "Propose ce que tu sais faire, trouve ce dont tu as besoin, entre étudiants ESD et ESP Bordeaux.",
  metadataBase: new URL("https://entraide-campus.vercel.app"),
  openGraph: { siteName: "L'entraide du campus", locale: "fr_FR", type: "website" },
};

function PiedDePage() {
  return (
    <footer className="border-t border-ligne px-4 py-4 text-center text-xs text-encre-douce">
      Projet étudiant non officiel, réalisé dans le cadre du module Vibe Coding (M2 Data).{" "}
      <Link href="/confidentialite" className="underline-offset-2 hover:underline">
        Confidentialité
      </Link>
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
  const { count: nonLues } = user
    ? await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("destinataire_id", user.id).eq("lu", false)
    : { count: 0 };

  return (
    <html lang="fr" className={`${archivo.variable} ${dmSans.variable} ${sourceSerif.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Suspense>
          <Toast />
        </Suspense>
        {user && profil ? (
          <div className="flex min-h-dvh flex-col md:flex-row">
            <Palette />
            <BarreLaterale
              pseudo={profil.pseudo}
              ecole={profil.ecole}
              avatar={<Avatar chemin={profil.avatar_chemin} nom={profil.pseudo} />}
              demandesEnAttente={enAttente ?? 0}
              estAdmin={profil.role === "admin"}
              moi={user.id}
              notificationsNonLues={nonLues ?? 0}
            />
            <div className="flex min-w-0 flex-1 flex-col">
              <main className="flex-1 px-4 pt-6 pb-28 sm:px-8 md:py-8">{children}</main>
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
