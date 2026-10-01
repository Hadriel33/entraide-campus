"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { deconnecter } from "@/app/(auth)/actions";
import { BadgeEcole } from "@/components/ui/badge";

// Entrées du menu de l'application connectée. Ajouter une page = ajouter une ligne ici.
export const LIENS = [{ href: "/compte", label: "Mon compte" }] as const;

function Monogramme() {
  return (
    <span className="flex size-8 items-center justify-center rounded-ui bg-encre text-[13px] font-bold text-surface" aria-hidden>
      ec
    </span>
  );
}

export function BarreLaterale({ prenom, ecole }: { prenom: string; ecole: string }) {
  const chemin = usePathname();
  const initiales = prenom.slice(0, 2).toUpperCase();

  return (
    <>
      {/* Bureau : barre latérale */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-6 border-r border-ligne bg-surface px-3.5 py-5 md:flex">
        <Link href="/" className="flex items-center gap-2.5 px-2 font-semibold">
          <Monogramme />
          L&apos;entraide du campus
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Navigation principale">
          {LIENS.map((l) => {
            const actif = chemin === l.href || chemin.startsWith(`${l.href}/`);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={actif ? "page" : undefined}
                className="rounded-ui px-2.5 py-2 font-medium text-encre-douce hover:bg-papier-fonce hover:text-encre aria-[current=page]:bg-papier-fonce aria-[current=page]:text-encre"
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-ui border border-ligne p-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-papier-fonce text-xs font-semibold" aria-hidden>
              {initiales}
            </span>
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2 font-semibold">
              <span className="truncate">{prenom}</span>
              <BadgeEcole ecole={ecole} />
            </span>
          </div>
          <form action={deconnecter}>
            <button className="w-full rounded-ui px-2.5 py-2 text-left text-sm text-encre-douce hover:bg-papier-fonce hover:text-encre">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile : barre du haut */}
      <header className="flex items-center justify-between gap-3 border-b border-ligne bg-surface px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Monogramme />
          <span className="sr-only">L&apos;entraide du campus</span>
        </Link>
        <nav className="flex items-center gap-1 text-sm" aria-label="Navigation principale">
          {LIENS.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-ui px-2.5 py-2 font-medium hover:bg-papier-fonce">
              {l.label}
            </Link>
          ))}
          <form action={deconnecter}>
            <button className="rounded-ui px-2.5 py-2 text-encre-douce hover:bg-papier-fonce">Déconnexion</button>
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
          <Link href="/connexion" className="rounded-ui px-3 py-2 font-medium hover:bg-papier-fonce">
            Se connecter
          </Link>
          <Link href="/inscription" className="rounded-ui bg-encre px-3 py-2 font-semibold text-surface hover:bg-encre/85">
            Créer un compte
          </Link>
        </div>
      </nav>
    </header>
  );
}
