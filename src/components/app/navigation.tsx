"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { BoutonTheme } from "./theme";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { deconnecter } from "@/app/(auth)/actions";
import { BadgeEcole } from "@/components/ui/badge";
import { Cloche } from "./cloche";

type Lien = { href: string; label: string; compteur?: number };

function liens(demandesEnAttente: number, estAdmin: boolean): Lien[] {
  return [
    { href: "/bureau", label: "Mon bureau" },
    { href: "/annonces", label: "Annonces" },
    { href: "/mur", label: "Le mur en direct" },
    { href: "/carte", label: "La carte" },
    { href: "/demandes", label: "Demandes", compteur: demandesEnAttente },
    { href: "/mes-annonces", label: "Mes annonces" },
    { href: "/favoris", label: "Favoris" },
    { href: "/classement", label: "Classement" },
    { href: "/compte", label: "Mon profil" },
    ...(estAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];
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
  moi,
  notificationsNonLues,
}: {
  moi: string;
  notificationsNonLues: number;
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
        <div className="flex items-center justify-between gap-1">
          <Link href="/bureau" className="flex items-center gap-2.5 px-2 font-semibold">
            <Logo />
          </Link>
          <Cloche moi={moi} nonLues={notificationsNonLues} />
        </div>
        <nav className="flex flex-col gap-0.5" aria-label="Navigation principale">
          {menu.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={actif(l.href) ? "page" : undefined}
              className="presse flex items-center rounded-ui px-2.5 py-2 font-medium text-encre-douce hover:bg-papier-fonce hover:text-encre aria-[current=page]:bg-papier-fonce aria-[current=page]:text-encre aria-[current=page]:shadow-[inset_3px_0_0_var(--color-accent)]"
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
          <BoutonTheme className="px-2.5 py-2 text-encre-douce hover:text-encre" />
          <p className="px-2.5 text-xs text-encre-douce">
            <kbd className="rounded border border-ligne-forte px-1 font-sans">Ctrl</kbd> + <kbd className="rounded border border-ligne-forte px-1 font-sans">K</kbd> pour aller n&apos;importe où
          </p>
          <form action={deconnecter}>
            <button className="presse w-full rounded-ui px-2.5 py-2 text-left text-sm text-encre-douce hover:bg-papier-fonce hover:text-encre">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile : barre du haut (logo, cloche) + barre d'onglets en bas, à portée de pouce */}
      <header className="sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-ligne bg-surface px-4 py-2 md:hidden">
        <Link href="/bureau" className="flex items-center gap-2 font-semibold">
          <Logo />
        </Link>
        <Cloche moi={moi} nonLues={notificationsNonLues} />
      </header>
      <OngletsMobile actif={actif} demandesEnAttente={demandesEnAttente} estAdmin={estAdmin} pseudo={pseudo} avatar={avatar} />
    </>
  );
}

export function EnTetePublic() {
  return (
    <header className="border-b border-ligne bg-surface">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3" aria-label="Navigation">
        <Link href="/" className="flex items-center gap-2.5 font-semibold">
          <Logo compact />
        </Link>
        <div className="flex items-center gap-2 text-sm">
          <BoutonTheme className="hidden px-3 py-2 sm:flex" />
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

// ---------- Barre d'onglets mobile ----------

function Icone({ d, className = "size-6" }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

const ICONES = {
  bureau: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z",
  annonces: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  demandes: "M22 12h-6l-2 3h-4l-2-3H2M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1Z",
  plus: "M12 5v14M5 12h14",
  classement: "M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function OngletsMobile({
  actif,
  demandesEnAttente,
  estAdmin,
  pseudo,
  avatar,
}: {
  actif: (href: string) => boolean;
  demandesEnAttente: number;
  estAdmin: boolean;
  pseudo: string;
  avatar: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(false);
  const onglet = "presse flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium text-encre-douce aria-[current=page]:text-encre";
  const plus = [
    { href: "/classement", label: "Classement" },
    { href: "/mur", label: "Le mur en direct" },
    { href: "/carte", label: "La carte" },
    { href: "/mes-annonces", label: "Mes annonces" },
    { href: "/favoris", label: "Favoris" },
    { href: "/compte", label: "Mon profil" },
    { href: `/profils/${pseudo}`, label: "Mon profil public" },
    ...(estAdmin ? [{ href: "/admin", label: "Admin" }] : []),
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-ligne bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navigation principale"
      >
        <Link href="/bureau" aria-current={actif("/bureau") ? "page" : undefined} className={onglet}>
          <Icone d={ICONES.bureau} />
          Bureau
        </Link>
        <Link href="/annonces" aria-current={actif("/annonces") ? "page" : undefined} className={onglet}>
          <Icone d={ICONES.annonces} />
          Annonces
        </Link>
        <Link href="/annonces/nouvelle" aria-label="Publier une annonce" className="presse flex flex-1 items-center justify-center">
          <span className="-mt-5 flex size-13 items-center justify-center rounded-full bg-encre text-surface shadow-lg ring-4 ring-papier">
            <Icone d={ICONES.plus} className="size-7" />
          </span>
        </Link>
        <Link href="/demandes" aria-current={actif("/demandes") ? "page" : undefined} className={`${onglet} relative`}>
          <Icone d={ICONES.demandes} />
          Demandes
          {demandesEnAttente > 0 && (
            <span className="pop absolute top-1 right-[calc(50%-20px)] min-w-4 rounded-full bg-accent px-1 text-center text-[10px] leading-4 font-semibold text-surface">
              {demandesEnAttente}
            </span>
          )}
        </Link>

        <button type="button" onClick={() => setOuvert(true)} aria-expanded={ouvert} className={onglet}>
          <Icone d={ICONES.menu} />
          Plus
        </button>
      </nav>

      {ouvert && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Plus">
          <button type="button" aria-label="Fermer" onClick={() => setOuvert(false)} className="fondu absolute inset-0 bg-encre/40" />
          <div className="monte absolute inset-x-0 bottom-0 flex flex-col gap-1 rounded-t-carte bg-surface p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mb-2 flex items-center gap-3 px-2">
              {avatar}
              <span className="font-semibold">@{pseudo}</span>
            </div>
            {plus.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOuvert(false)} className="presse rounded-ui px-3 py-3 font-medium hover:bg-papier-fonce">
                {l.label}
              </Link>
            ))}
            <BoutonTheme className="px-3 py-3 font-medium" />
            <form action={deconnecter}>
              <button className="presse w-full rounded-ui px-3 py-3 text-left text-encre-douce hover:bg-papier-fonce">Se déconnecter</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
