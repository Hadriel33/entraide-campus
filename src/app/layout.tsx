import type { Metadata } from "next";
import Link from "next/link";
import { getUtilisateur } from "@/lib/supabase/server";
import { deconnecter } from "./(auth)/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "L'entraide du campus", template: "%s · L'entraide du campus" },
  description: "Propose ce que tu sais faire, trouve ce dont tu as besoin, entre étudiants ESD et ESP Bordeaux.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const utilisateur = await getUtilisateur();

  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-ligne">
          <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="font-semibold">
              L&apos;entraide du campus
            </Link>
            <div className="flex items-center gap-4 text-sm">
              {utilisateur ? (
                <>
                  <Link href="/compte" className="underline-offset-4 hover:underline">
                    Mon compte
                  </Link>
                  <form action={deconnecter}>
                    <button className="underline-offset-4 hover:underline">Se déconnecter</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/connexion" className="underline-offset-4 hover:underline">
                    Se connecter
                  </Link>
                  <Link href="/inscription" className="rounded-md bg-encre px-3 py-1.5 text-papier">
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
        <main className="flex flex-1 flex-col px-4">{children}</main>
        <footer className="border-t border-ligne px-4 py-4 text-center text-xs text-encre-douce">
          Projet étudiant non officiel, réalisé dans le cadre du module Vibe Coding (M2 Data).
        </footer>
      </body>
    </html>
  );
}
