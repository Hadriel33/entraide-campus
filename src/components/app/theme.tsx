"use client";

import { useSyncExternalStore } from "react";

const CLE = "postit-theme";

// Le thème est posé sur <html data-theme> par un petit script avant l'affichage (layout), puis piloté ici.
function lire() {
  return typeof document !== "undefined" &&
    document.documentElement.dataset.theme === "noir"
    ? "noir"
    : "clair";
}
function abonner(rappel: () => void) {
  window.addEventListener(CLE, rappel);
  return () => window.removeEventListener(CLE, rappel);
}

export const SCRIPT_THEME = `try{if(localStorage.getItem("${CLE}")==="noir")document.documentElement.dataset.theme="noir"}catch(e){}`;

// Le libellé et l'icône suivent le thème par le CSS (data-theme sur <html>), pas par l'état React : le HTML du
// serveur et celui du navigateur sont donc toujours identiques (aucun écart à l'hydratation).
export function BoutonTheme({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(abonner, lire, () => "clair");
  const noir = theme === "noir";

  function basculer() {
    const suivant = lire() === "noir" ? "clair" : "noir";
    if (suivant === "noir") document.documentElement.dataset.theme = "noir";
    else delete document.documentElement.dataset.theme;
    try {
      localStorage.setItem(CLE, suivant);
    } catch {}
    window.dispatchEvent(new Event(CLE));
  }

  return (
    <button
      type="button"
      onClick={basculer}
      aria-pressed={noir}
      suppressHydrationWarning
      className={`presse flex items-center gap-2 rounded-ui text-sm hover:bg-papier-fonce ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path className="theme-si-noir" d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0" />
        <path className="theme-si-clair" d="M3 5h18v12H3zM8 21h8M12 17v4M7 9h5M7 12h3" />
      </svg>
      <span className="theme-si-noir">Mode clair</span>
      <span className="theme-si-clair">Tableau noir</span>
    </button>
  );
}
