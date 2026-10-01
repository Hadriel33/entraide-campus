"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deconnecter } from "@/app/(auth)/actions";
import { BadgeEcole } from "@/components/ui/badge";

type Lien = { href: string; label: string; compteur?: number };

function liens(demandesEnAttente: number, estAdmin: boolean): Lien[] {
  return [
    { href: "/annonces", label: "Annonces" },
    { href: "/demandes", label: "Demandes", compteur: demandesEnAttente },
    { href: "/mes-annonces", label: "Mes annonces" },
    { href: "/classement", label: "Classement" },
    { href: "/compte", label: "Mon profil" },
    ...(estAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
}

function Monogramme() {
  return (
    <span className="flex size-8 items-center justify-center rounded-ui bg-encre text-[13px] font-bold text-surface" aria-hidden>
      ec
    </span>
  );
}

function Compteur({ n }: { n?: number }) {
  if (!n) return null;
  return (
    <span className="pop ml-auto min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 font-semibold text-surface">
      {n}
      <span className="sr-only"> en attente</span>
    </span>
  );
}

export function BarreLaterale({
  pseudo,
  ecole,
  avatar,
  demandesEnAttente,
  estAdmin,
}: {
  pseudo: string;
  ecole: string;
  avatar: React.ReactNode;
  demandesEnAttente: number;
  estAdmin: boolean;
}) {
  const chemin = usePathname();
  const menu = liens(demandesEnAttente, estAdmin);
  const actif = (href: string) => chemin === href || chemin.startsWith(`${href}/`);

  return (
    <>
      {/* Bureau : barre latérale */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-ligne bg-surface px-3.5 py-5 md:flex">
        <Link href="/annonces" className="flex items-center gap-2.5 px-2 font-semibold">
          <Monogramme />
          L&apos;entraide du campus
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Navigation principale">
          {menu.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif(l.href) ? "page" : undefined}
              className="presse flex items-center rounded-ui px-2.5 py-2 font-medium text-encre-douce hover:bg-papier-fonce hover:text-encre aria-[current=page]:bg-papier-fonce aria-[current=page]:text-encre"
            >
              {l.label}
              <Compteur n={l.compteur} />
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <Link href={`/profils/${pseudo}`} className="presse flex items-center gap-2.5 rounded-ui border border-ligne p-2.5 hover:bg-papier-fonce">
            {avatar}
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2 font-semibold">
              <span className="truncate">@{pseudo}</span>
              <BadgeEcole ecole={ecole} />
            </span>
          </Link>
          <form action={deconnecter}>
            <button className="presse w-full rounded-ui px-2.5 py-2 text-left text-sm text-encre-douce hover:bg-papier-fonce hover:text-encre">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile : barre du haut + menu défilant */}
      <header className="sticky top-0 z-40 border-b border-ligne bg-surface md:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5">
          <Link href="/annonces" className="flex items-center gap-2 font-semibold">
            <Monogramme />
            <span className="text-sm">L&apos;entraide du campus</span>
          </Link>
          <Link href={`/profils/${pseudo}`} aria-label="Mon profil public">
            {avatar}
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 text-sm" aria-label="Navigation principale">
          {menu.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif(l.href) ? "page" : undefined}
              className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-encre-douce aria-[current=page]:bg-encre aria-[current=page]:text-surface"
            >
              {l.label}
              {!!l.compteur && <span className="rounded-full bg-accent px-1.5 text-[11px] leading-4 text-surface">{l.compteur}</span>}
            </Link>
          ))}
          <form action={deconnecter} className="shrink-0">
            <button className="rounded-full px-3 py-1.5 text-encre-douce">Déconnexion</button>
          </form>
        </nav>
      </header>
    </>
  );
}

export function EnTetePublic() {
  return (
    <header className="border-b border-ligne bg-surface">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3" aria-label="Navigation">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Monogramme />
          <span className="hidden sm:inline">L&apos;entraide du campus</span>
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <Link href="/connexion" className="presse rounded-ui px-3 py-2 font-medium hover:bg-papier-fonce">
            Se connecter
          </Link>
          <Link href="/inscription" className="presse rounded-ui bg-encre px-3 py-2 font-semibold text-surface hover:bg-encre/85">
            Créer un compte
          </Link>
        </div>
      </nav>
    </header>
  );
}
