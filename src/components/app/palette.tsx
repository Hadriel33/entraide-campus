"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Commande = { label: string; aide: string; href: string };

const PAGES: Commande[] = [
  { label: "Annonces", aide: "Toutes les annonces du campus", href: "/annonces" },
  { label: "La carte", aide: "Les annonces par quartier et ligne de tram", href: "/carte" },
  { label: "Le mur en direct", aide: "À projeter : les annonces arrivent en direct", href: "/mur" },
  { label: "Publier une annonce", aide: "Raccourci : n", href: "/annonces/nouvelle" },
  { label: "Demandes", aide: "Reçues et envoyées", href: "/demandes" },
  { label: "Notifications", aide: "Ce qui te concerne", href: "/notifications" },
  { label: "Mes annonces", aide: "Publiées, archivées, prolonger", href: "/mes-annonces" },
  { label: "Favoris", aide: "Annonces gardées de côté", href: "/favoris" },
  { label: "Classement", aide: "Points, défi de la semaine", href: "/classement" },
  { label: "Mon profil", aide: "Photo, compétences, coordonnées", href: "/compte" },
  { label: "Annonces gratuites", aide: "Filtre : contrepartie gratuite", href: "/annonces?contrepartie=gratuit" },
  { label: "Coloc et logement", aide: "Filtre : catégorie", href: "/annonces?categorie=coloc" },
  { label: "Covoiturage", aide: "Filtre : catégorie", href: "/annonces?categorie=covoiturage" },
];

function enSaisie(cible: EventTarget | null) {
  const el = cible as HTMLElement | null;
  return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || el.isContentEditable);
}

// Palette de commandes (Ctrl+K ou Cmd+K) et raccourcis clavier : « / » pour chercher, « n » pour publier.
export function Palette() {
  const [ouvert, setOuvert] = useState(false);
  const [texte, setTexte] = useState("");
  const [index, setIndex] = useState(0);
  const champ = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const resultats = useMemo(() => {
    const t = texte.trim().toLowerCase();
    const pages = t ? PAGES.filter((p) => `${p.label} ${p.aide}`.toLowerCase().includes(t)) : PAGES;
    return t ? [{ label: `Chercher « ${texte.trim()} »`, aide: "Dans les annonces", href: `/annonces?q=${encodeURIComponent(texte.trim())}` }, ...pages] : pages;
  }, [texte]);

  useEffect(() => {
    function surTouche(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOuvert((o) => !o);
        return;
      }
      if (enSaisie(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "/") {
        const recherche = document.querySelector<HTMLInputElement>('input[name="q"]');
        e.preventDefault();
        if (recherche) recherche.focus();
        else setOuvert(true);
      } else if (e.key === "n") {
        router.push("/annonces/nouvelle");
      }
    }
    window.addEventListener("keydown", surTouche);
    return () => window.removeEventListener("keydown", surTouche);
  }, [router]);

  useEffect(() => {
    if (ouvert) champ.current?.focus();
  }, [ouvert]);

  function aller(href: string) {
    setOuvert(false);
    setTexte("");
    setIndex(0);
    router.push(href);
  }

  if (!ouvert) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]" role="dialog" aria-modal="true" aria-label="Aller à">
      <button type="button" aria-label="Fermer" onClick={() => setOuvert(false)} className="fondu absolute inset-0 bg-encre/40" />
      <div className="pop relative w-full max-w-lg overflow-hidden rounded-carte border border-ligne bg-surface shadow-2xl">
        <input
          ref={champ}
          value={texte}
          onChange={(e) => {
            setTexte(e.target.value);
            setIndex(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOuvert(false);
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setIndex((i) => Math.min(i + 1, resultats.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setIndex((i) => Math.max(i - 1, 0));
            } else if (e.key === "Enter" && resultats[index]) aller(resultats[index].href);
          }}
          placeholder="Aller à une page ou chercher une annonce..."
          aria-label="Aller à une page ou chercher une annonce"
          className="w-full border-b border-ligne px-4 py-3.5 text-base outline-none"
        />
        <ul className="max-h-80 overflow-y-auto p-1.5" role="listbox">
          {resultats.map((r, i) => (
            <li key={r.href} role="option" aria-selected={i === index}>
              <button
                type="button"
                onMouseEnter={() => setIndex(i)}
                onClick={() => aller(r.href)}
                className={`flex w-full items-center justify-between gap-3 rounded-ui px-3 py-2.5 text-left ${i === index ? "bg-papier-fonce" : ""}`}
              >
                <span className="font-medium">{r.label}</span>
                <span className="text-xs text-encre-douce">{r.aide}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-ligne px-4 py-2 text-xs text-encre-douce">Entrée pour ouvrir · flèches pour choisir · Échap pour fermer</p>
      </div>
    </div>
  );
}
