"use client";

import { useState } from "react";

// Partager une annonce : menu natif du téléphone (WhatsApp, Insta...) ou copie du lien sur ordinateur.
export function BoutonPartager({ titre }: { titre: string }) {
  const [copie, setCopie] = useState(false);

  async function partager() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: titre, text: `${titre} · L'entraide du campus`, url });
        return;
      } catch {
        // partage annulé : on ne fait rien
        return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopie(true);
    setTimeout(() => setCopie(false), 2500);
  }

  return (
    <button
      type="button"
      onClick={partager}
      className="presse flex min-h-10 items-center gap-2 rounded-ui border border-ligne-forte bg-surface px-3 text-sm font-semibold hover:bg-papier-fonce"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" />
      </svg>
      <span aria-live="polite">{copie ? "Lien copié" : "Partager"}</span>
    </button>
  );
}
