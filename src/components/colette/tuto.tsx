"use client";

import { useState, useSyncExternalStore } from "react";
import { Colette, type AnimColette } from "./colette";

const CLE = "postit-tuto";
const ETAPES: { anim: AnimColette; texte: string }[] = [
  { anim: "coucou", texte: "Salut, je suis Colette la guide (casquette verte, pancarte « ? »). Ta Colette à toi, tu la crées dans ton profil. Ici, c'est ton bureau : tout ce qui t'attend est punaisé en haut." },
  {
    anim: "accroche",
    texte: "Sur le tableau, chaque post-it est une annonce. Le pictogramme en haut dit la catégorie, la forme dit le type : billet pour un covoit, petite annonce pour une coloc, étiquette pour un prêt, polaroid pour un shooting.",
  },
  { anim: "tampon", texte: "Un post-it te plaît ? « Demander le contact ». Ton numéro reste caché tant que tu n'as pas dit oui." },
  { anim: "lit", texte: "Mes 4 IA : je lis ton CV pour proposer tes compétences, j'écris un post-it à partir d'une phrase, je le relis avant publication, et je trie le tableau « Pour moi ». Tout est expliqué dans « Les IA de Colette »." },
  { anim: "saute", texte: "Le fil, c'est la vie du campus : réagis, commente, mentionne avec @pseudo. Reviens chaque semaine pour garder ta série et gagner des tenues." },
];

// Le stockage local peut être bloqué (navigation privée) : dans ce cas le tuto ne s'affiche simplement pas.
function lire() {
  try {
    return localStorage.getItem(CLE) ?? "";
  } catch {
    return "vu";
  }
}
function abonner(rappel: () => void) {
  window.addEventListener("storage", rappel);
  window.addEventListener(CLE, rappel);
  return () => {
    window.removeEventListener("storage", rappel);
    window.removeEventListener(CLE, rappel);
  };
}

// Tuto de premier passage : Colette en bas de l'écran, une bulle par étape, « Passer » toujours visible.
export function TutoColette() {
  const vu = useSyncExternalStore(abonner, lire, () => "vu");
  const [etape, setEtape] = useState(0);
  if (vu) return null;

  const fermer = () => {
    try {
      localStorage.setItem(CLE, "vu");
    } catch {}
    window.dispatchEvent(new Event(CLE));
  };
  const e = ETAPES[etape];
  const derniere = etape === ETAPES.length - 1;

  return (
    <div role="dialog" aria-label="Visite guidée avec Colette" className="pop fixed right-4 bottom-40 z-50 flex max-w-sm items-end gap-2 md:bottom-24">
      <div className="relative flex flex-col gap-3 rounded-carte border border-encre bg-surface p-4 shadow-[4px_4px_0_0_var(--color-ok)]">
        <span className="flex items-baseline justify-between gap-3">
          <span className="rounded-full bg-ok-fond px-2 py-0.5 text-xs font-bold text-ok">Colette, ta guide</span>
          <span className="text-xs font-semibold text-encre-douce">
            {etape + 1} / {ETAPES.length}
          </span>
        </span>
        <p key={etape} className="apparition text-[0.95rem] leading-snug">
          {e.texte}
        </p>
        <div className="flex items-center justify-between gap-2">
          <button type="button" onClick={fermer} className="presse rounded-ui px-2 py-1.5 text-sm text-encre-douce hover:bg-papier-fonce hover:text-encre">
            Passer
          </button>
          <button
            type="button"
            onClick={() => (derniere ? fermer() : setEtape((n) => n + 1))}
            className="presse rounded-ui bg-encre px-3.5 py-2 text-sm font-semibold text-surface"
          >
            {derniere ? "C'est parti" : "Suivant"}
          </button>
        </div>
        <span className="absolute -right-2 bottom-6 size-4 rotate-45 border-t border-r border-encre bg-surface" aria-hidden />
      </div>
      <Colette key={e.anim} anim={e.anim} accessoire="guide" couleur="ciel" saison={false} taille={96} className="shrink-0" />
    </div>
  );
}

// Relancer la visite guidée (page « Les IA de Colette ») : on oublie qu'elle a été vue.
export function BoutonRevoirTuto({ className = "" }: { className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        try {
          localStorage.removeItem(CLE);
        } catch {}
        window.dispatchEvent(new Event(CLE));
      }}
    >
      Revoir la visite avec la guide
    </button>
  );
}
