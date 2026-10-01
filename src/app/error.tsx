"use client";

import { Bouton } from "@/components/ui/bouton";
import { TitrePage } from "@/components/ui/titre-page";
import { Colette } from "@/components/colette/colette";

// Erreur inattendue : un message clair et un bouton pour réessayer, jamais un écran bloqué.
export default function Erreur({ reset }: { error: Error; reset: () => void }) {
  return (
    <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-8 py-16 sm:flex-row sm:items-center">
      <Colette anim="debordee" taille={140} className="shrink-0 self-center" />
      <div className="flex flex-col gap-6">
        <TitrePage accroche="Colette est débordée, quelque chose s'est mal passé de notre côté. Réessaie dans un instant.">Oups</TitrePage>
        <div>
          <Bouton onClick={reset}>Réessayer</Bouton>
        </div>
      </div>
    </section>
  );
}
