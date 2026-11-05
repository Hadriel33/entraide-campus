"use client";

import { useState } from "react";
import { Colette } from "@/components/colette/colette";
import { STICKERS, stickerDe } from "@/lib/messages/stickers";

// Les « emoji » de l'appli : les stickers de Colette, partout où on écrit (discussions, salons, commentaires).
// Un sticker est un texte ordinaire (« [colette:merci] ») : rien de nouveau en base.

export function StickerAffiche({ contenu, taille = 60 }: { contenu: string; taille?: number }) {
  const s = stickerDe(contenu);
  if (!s) return null;
  return (
    <span className="pop flex flex-col items-center" title={s.legende}>
      <Colette couleur={s.couleur} humeur={s.humeur} anim={s.anim} accessoire={s.accessoire} saison={false} taille={taille} titre={s.legende} />
      <span className="-mt-1 -rotate-2 font-main text-base leading-none">{s.legende}</span>
    </span>
  );
}

// Le bouton « Colette » qui ouvre la planche de stickers. En formulaire (commentaires) : chaque sticker est un
// bouton d'envoi « sticker=code » ; sinon (salons) : onChoisir(code).
export function ChoixSticker({ onChoisir, enFormulaire = false }: { onChoisir?: (code: string) => void; enFormulaire?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((o) => !o)}
        aria-expanded={ouvert}
        aria-label="Envoyer un sticker Colette"
        className="presse flex size-10 items-center justify-center rounded-full border border-ligne-forte bg-surface hover:border-encre"
      >
        <Colette tete humeur="contente" saison={false} taille={26} />
      </button>
      {ouvert && (
        <div className="pop absolute right-0 bottom-full z-20 mb-2 grid w-64 grid-cols-3 gap-1 rounded-carte border border-encre bg-surface p-2 shadow-[3px_3px_0_0_var(--color-bandeau)]">
          {STICKERS.map((s) => (
            <button
              key={s.code}
              type={enFormulaire ? "submit" : "button"}
              name={enFormulaire ? "sticker" : undefined}
              value={enFormulaire ? s.code : undefined}
              onClick={() => {
                setOuvert(false);
                onChoisir?.(s.code);
              }}
              title={s.legende}
              className="presse flex flex-col items-center gap-0.5 rounded-ui p-1 hover:bg-papier-fonce"
            >
              <Colette tete couleur={s.couleur} humeur={s.humeur} accessoire={s.accessoire} saison={false} taille={40} />
              <span className="text-[10px] leading-tight font-semibold">{s.legende}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
